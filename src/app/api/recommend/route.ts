import { NextRequest, NextResponse } from 'next/server'
import { toCatalogItem } from '@/lib/catalog'
import {
  getDiscoverMovies,
  getDiscoverTV,
  getMovieRecommendations,
  getTVRecommendations,
  type DiscoverParams,
  type TMDBMovie,
} from '@/lib/tmdb'
import {
  computeSignals,
  diversifyByGenre,
  isAcceptable,
  normalizeTMDBItem,
  rotateRanked,
  utcDateKey,
  type MediaType,
  type ScorableItem,
} from '@/lib/recommend'
import { rateLimit } from '@/lib/rateLimit'

const SEED_RE = /^(movie|tv):(\d{1,9})$/

const respond = (
  body: unknown,
  status: number,
  cacheControl = 'public, max-age=60, s-maxage=900, stale-while-revalidate=86400'
) =>
  NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': cacheControl },
  })

const invalid = () => respond({ results: [], error: 'invalid_params' }, 400, 'no-store')

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, 'recommend', 60, 60_000)
  if (limited) return limited

  const params = request.nextUrl.searchParams
  const rawSeeds = (params.get('seeds') || '').split(',').map((s) => s.trim()).filter(Boolean)
  const rawGenres = (params.get('genres') || '').split(',').map((s) => s.trim()).filter(Boolean)
  const rawLangs = (params.get('langs') || '').split(',').map((s) => s.trim()).filter(Boolean)
  const rawExclude = (params.get('exclude') || '').split(',').map((s) => s.trim()).filter(Boolean)
  const limit = Math.min(Math.max(Number(params.get('limit')) || 18, 1), 24)
  const requestedDay = params.get('day') || ''
  const day = /^\d{4}-\d{2}-\d{2}$/.test(requestedDay) ? requestedDay : utcDateKey(new Date())

  if (rawSeeds.length > 4 || rawSeeds.some((seed) => !SEED_RE.test(seed))) return invalid()
  if (rawGenres.length > 4 || rawGenres.some((genre) => !/^\d{1,6}$/.test(genre))) return invalid()
  if (rawLangs.length > 4 || rawLangs.some((lang) => !/^[a-z]{2}$/.test(lang))) return invalid()
  if (rawExclude.length > 60 || rawExclude.some((id) => !/^\d{1,9}$/.test(id))) return invalid()

  const seeds = rawSeeds.map((seed) => {
    const match = SEED_RE.exec(seed)!
    return { type: match[1] as MediaType, id: match[2] }
  })
  const genres = rawGenres.map(Number)
  const langs = rawLangs
  const excluded = new Set(rawExclude.map(Number))

  if (seeds.length === 0 && genres.length === 0) {
    return respond({ results: [], reason: 'no_personalization' }, 200, 'public, max-age=60, s-maxage=60')
  }

  try {
    const nowMs = Date.now()

    const seedLists = await Promise.all(
      seeds.map(async (seed) => {
        const data =
          seed.type === 'movie'
            ? await getMovieRecommendations(seed.id)
            : await getTVRecommendations(seed.id)
      return data
      })
    )

    const discoverParams: DiscoverParams = {
      'vote_count.gte': 50,
      sort_by: 'popularity.desc',
    }
    if (genres.length > 0) discoverParams.with_genres = genres.join('|')
    if (langs.length > 0) discoverParams.with_original_language = langs[0]

    const discoverPages = [1, 2, 3]
    const [movieLists, tvLists] = await Promise.all([
      Promise.all(discoverPages.map((page) => getDiscoverMovies({ ...discoverParams, page }))),
      Promise.all(discoverPages.map((page) => getDiscoverTV({ ...discoverParams, page }))),
    ])
    const discoverMovieResults = movieLists.flatMap((list) => list.results)
    const discoverTvResults = tvLists.flatMap((list) => list.results)

    const successfulSources = [
      ...seedLists,
      ...movieLists,
      ...tvLists,
    ].filter((source) => source.ok).length
    const attemptedSources = seedLists.length + movieLists.length + tvLists.length

    if (successfulSources === 0) {
      return respond({ results: [], reason: 'unavailable' }, 503, 'no-store')
    }

    const candidates = new Map<string, { item: ScorableItem; affinity: number }>()
    const seedWeights = [1, 0.85, 0.7, 0.55]

    const addCandidate = (raw: TMDBMovie, type: MediaType, affinity: number) => {
      const item = normalizeTMDBItem(raw, type)
      if (!isAcceptable(item, nowMs)) return
      if (excluded.has(item.id)) return

      const key = `${item.mediaType}:${item.id}`
      const existing = candidates.get(key)
      if (!existing) {
        candidates.set(key, { item, affinity })
      } else {
        candidates.set(key, {
          item: existing.item,
          affinity: Math.min(1.2, Math.max(existing.affinity, affinity) + 0.1),
        })
      }
    }

    seedLists.forEach((list, seedIndex) => {
      if (!list.ok) return
      list.results.forEach((raw, index) => {
        const affinity =
          0.9 * Math.pow(0.94, index) * (seedWeights[seedIndex] ?? 0.5)
        addCandidate(raw, seeds[seedIndex].type, affinity)
      })
    })

    discoverMovieResults.forEach((raw: TMDBMovie) =>
      addCandidate(raw, 'movie', 0)
    )
    discoverTvResults.forEach((raw: TMDBMovie) =>
      addCandidate(raw, 'tv', 0)
    )

    const genreSet = new Set(genres)
    const scored = Array.from(candidates.values())
      .map(({ item, affinity }) => {
        const signals = computeSignals(item, nowMs)
        const overlap =
          genres.length > 0
            ? item.genreIds.filter((genre: number) => genreSet.has(genre)).length / genres.length
            : 0
        return {
          ...item,
          score:
            0.4 * Math.min(1, affinity) +
            0.25 * signals.quality +
            0.15 * signals.fresh +
            0.1 * signals.pop +
            0.1 * overlap,
        }
      })
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.id - b.id)

    const seedKey = `${day}:${seeds.map((seed) => `${seed.type}:${seed.id}`).join(',')}:${genres.join(',')}:${langs.join(',')}`
    const selected = diversifyByGenre(rotateRanked(scored, limit, seedKey, 100, 2)).slice(0, limit)
    const results = selected.map((item) =>
      toCatalogItem(
        {
          id: item.id,
          title: item.title,
          poster_path: item.posterPath,
          release_date: item.date,
          vote_average: item.rating,
          genre_ids: item.genreIds,
          original_language: item.originalLanguage,
        },
        item.mediaType
      )
    )

    const partial = successfulSources < attemptedSources
    return respond(
      {
        results,
        reason: seeds.length > 0 ? 'because_watched' : 'genres',
        ...(partial ? { degraded: true } : {}),
      },
      200,
      partial ? 'no-store' : undefined
    )
  } catch {
    return respond({ results: [], reason: 'unavailable' }, 503, 'no-store')
  }
}
