import { getImageUrl } from '@/lib/catalog'
import { genreNamesFor } from '@/lib/genres'
import type { Movie } from '@/lib/data'

export type MediaType = 'movie' | 'tv'

export interface TMDBItemLike {
  id: number
  title?: string
  name?: string
  original_title?: string
  original_name?: string
  poster_path?: string | null
  backdrop_path?: string | null
  overview?: string
  release_date?: string
  first_air_date?: string
  last_air_date?: string
  vote_average?: number
  vote_count?: number
  popularity?: number
  genre_ids?: number[]
  original_language?: string
  adult?: boolean
  video?: boolean
}

export interface ScorableItem {
  id: number
  mediaType: MediaType
  title: string
  originalTitle?: string
  posterPath: string | null
  backdropPath: string | null
  overview: string
  date: string
  lastAirDate?: string
  rating: number
  voteCount: number
  popularity: number
  genreIds: number[]
  originalLanguage: string
  adult?: boolean
  video?: boolean
  trendIndex?: number
  onAirIndex?: number
  inNowPlaying?: boolean
  score?: number
}

export interface Signals {
  quality: number
  pop: number
  fresh: number
  newness: number
  trend: number
  onAirRank: number
  ageDays: number
}

export const MIN_VOTES: Record<MediaType, number> = { movie: 300, tv: 200 }
export const MEAN_RATING = 6.6
export const FRESH_HALF_LIFE_DAYS = 45
export const NEW_WINDOW_DAYS = 45
export const SEMI_NEW_DAYS = 90
export const TREND_POSITION_DECAY = 0.93
export const ROTATION_VERSION = 'v1'

const EXCLUDED_TV_GENRES = new Set([10763, 10767, 10766]) // news, talk, soap

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export const normalizeTMDBItem = (
  raw: TMDBItemLike,
  mediaType: MediaType,
  extra?: Partial<Pick<ScorableItem, 'trendIndex' | 'onAirIndex' | 'inNowPlaying'>>
): ScorableItem => ({
  id: raw.id,
  mediaType,
  title: raw.title || raw.name || 'Untitled',
  originalTitle: raw.original_title || raw.original_name,
  posterPath: raw.poster_path ?? null,
  backdropPath: raw.backdrop_path ?? null,
  overview: raw.overview || '',
  date: raw.release_date || raw.first_air_date || '',
  lastAirDate: raw.last_air_date,
  rating: raw.vote_average ?? 0,
  voteCount: raw.vote_count ?? 0,
  popularity: raw.popularity ?? 0,
  genreIds: raw.genre_ids ?? [],
  originalLanguage: raw.original_language ?? '',
  adult: raw.adult,
  video: raw.video,
  ...extra,
})

export const weightedRating = (rating: number, votes: number, mediaType: MediaType) => {
  const m = MIN_VOTES[mediaType]
  const v = Math.max(0, votes)
  const r = clamp(rating, 0, 10)
  return (v / (v + m)) * r + (m / (v + m)) * MEAN_RATING
}

export const qualityScore = (weighted: number) => clamp((weighted - 5) / 3.5, 0, 1)

export const popularityScore = (popularity: number) =>
  clamp(Math.log1p(Math.max(0, popularity)) / Math.log1p(500), 0, 1)

export const daysSince = (dateStr: string | undefined, nowMs: number) => {
  if (!dateStr) return Number.POSITIVE_INFINITY
  const time = new Date(dateStr).getTime()
  if (Number.isNaN(time)) return Number.POSITIVE_INFINITY
  return (nowMs - time) / 86_400_000
}

export const freshnessScore = (ageDays: number) =>
  ageDays <= 0 ? 1 : clamp(Math.pow(0.5, ageDays / FRESH_HALF_LIFE_DAYS), 0, 1)

export const newnessScore = (ageDays: number) => {
  if (ageDays <= NEW_WINDOW_DAYS) return 1
  if (ageDays <= SEMI_NEW_DAYS) return (SEMI_NEW_DAYS - ageDays) / (SEMI_NEW_DAYS - NEW_WINDOW_DAYS)
  return 0
}

export const positionalScore = (index: number) =>
  index <= 0 ? 1 : clamp(Math.pow(TREND_POSITION_DECAY, index), 0, 1)

// Returning shows on air count as fresh even if the series started years ago
export const ageDaysFor = (item: ScorableItem, nowMs: number) => {
  const base =
    item.mediaType === 'tv'
      ? daysSince(item.lastAirDate || item.date, nowMs)
      : daysSince(item.date, nowMs)
  if (
    item.mediaType === 'tv' &&
    item.onAirIndex !== undefined &&
    daysSince(item.date, nowMs) > 365
  ) {
    return Math.min(base, 7)
  }
  return base
}

export const computeSignals = (item: ScorableItem, nowMs: number): Signals => {
  const ageDays = ageDaysFor(item, nowMs)
  return {
    quality: qualityScore(weightedRating(item.rating, item.voteCount, item.mediaType)),
    pop: popularityScore(item.popularity),
    fresh: freshnessScore(ageDays),
    newness: newnessScore(ageDays),
    trend: item.trendIndex !== undefined ? positionalScore(item.trendIndex) : 0,
    onAirRank:
      item.onAirIndex !== undefined ? 0.9 * positionalScore(item.onAirIndex) : 0,
    ageDays,
  }
}

export const isAcceptable = (item: ScorableItem, nowMs: number) => {
  if (!item.posterPath) return false
  if (item.adult || item.video) return false
  if (daysSince(item.date, nowMs) < -1) return false
  return true
}

export const isTelevisionFriendly = (item: ScorableItem) =>
  item.mediaType !== 'tv' ||
  !item.genreIds.some((id) => EXCLUDED_TV_GENRES.has(id))

const minDefined = (a?: number, b?: number) => {
  if (a === undefined) return b
  if (b === undefined) return a
  return Math.min(a, b)
}

export const dedupe = (items: ScorableItem[]): ScorableItem[] => {
  const map = new Map<string, ScorableItem>()

  for (const item of items) {
    const key = `${item.mediaType}:${item.id}`
    const existing = map.get(key)
    if (!existing) {
      map.set(key, { ...item })
      continue
    }

    const itemBetter =
      item.voteCount > existing.voteCount ||
      (item.voteCount === existing.voteCount && item.popularity > existing.popularity)
    const best = itemBetter ? item : existing

    map.set(key, {
      ...best,
      trendIndex: minDefined(existing.trendIndex, item.trendIndex),
      onAirIndex: minDefined(existing.onAirIndex, item.onAirIndex),
      inNowPlaying: existing.inNowPlaying || item.inNowPlaying,
    })
  }

  return Array.from(map.values())
}

// Weighted round-robin: take `ratio` from primary for every 1 from secondary
export const interleave = <T>(primary: T[], secondary: T[], ratio = 3): T[] => {
  const out: T[] = []
  let i = 0
  let j = 0

  while (i < primary.length || j < secondary.length) {
    for (let k = 0; k < ratio && i < primary.length; k++) {
      out.push(primary[i++])
    }
    if (j < secondary.length) {
      out.push(secondary[j++])
    }
  }

  return out
}

export const diversifyByGenre = <T extends ScorableItem>(items: T[], maxRun = 2): T[] => {
  const out: T[] = []
  const deferred: T[] = []
  let lastGenre = -1
  let run = 0

  for (const item of items) {
    const genre = item.genreIds[0] ?? -1
    if (genre === lastGenre && run >= maxRun) {
      deferred.push(item)
      continue
    }
    if (genre === lastGenre) {
      run += 1
    } else {
      lastGenre = genre
      run = 1
    }
    out.push(item)
  }

  return [...out, ...deferred]
}

export const hashSeed = (value: string) => {
  let hash = 0x811c9dc5
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

export const mulberry32 = (seed: number) => {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const shuffle = <T>(items: T[], random: () => number) => {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

export const utcDateKey = (now: Date) => now.toISOString().slice(0, 10)

// Rotate membership without letting weak titles reach the top:
// shuffle inside score bands, then concatenate from the highest band down
export const dailySample = (items: ScorableItem[], count: number, seedKey: string) => {
  const bands: ScorableItem[][] = Array.from({ length: 20 }, () => [])

  for (const item of items) {
    const band = Math.min(19, Math.floor(clamp(item.score ?? 0, 0, 1) * 20))
    bands[band].push(item)
  }

  const picked: ScorableItem[] = []
  for (let band = bands.length - 1; band >= 0 && picked.length < count; band--) {
    if (bands[band].length === 0) continue
    const random = mulberry32(hashSeed(`${seedKey}:${band}`))
    shuffle(bands[band], random)
    picked.push(...bands[band])
  }

  return picked.slice(0, count)
}

export const rotateRanked = (
  sortedItems: ScorableItem[],
  count: number,
  seedKey: string,
  poolSize = 40
) => {
  const pool = sortedItems.slice(0, poolSize)
  const sampled = dailySample(pool, count, seedKey)
  return sampled.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
}

export const ensureLanguageMix = (
  selected: ScorableItem[],
  backfill: ScorableItem[],
  minHindi: number,
  seedKey: string
) => {
  const hindiCount = selected.filter((item) => item.originalLanguage === 'hi').length
  if (hindiCount >= minHindi) return selected

  const selectedKeys = new Set(selected.map((item) => `${item.mediaType}:${item.id}`))
  const candidates = backfill
    .filter((item) => item.originalLanguage === 'hi')
    .filter((item) => !selectedKeys.has(`${item.mediaType}:${item.id}`))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))

  if (candidates.length === 0) return selected

  const pool = dailySample(candidates, minHindi - hindiCount, `${seedKey}:hi`)
  const result = [...selected]

  for (const candidate of pool) {
    if (result.filter((item) => item.originalLanguage === 'hi').length >= minHindi) break
    for (let i = result.length - 1; i >= 0; i--) {
      if (result[i].originalLanguage !== 'hi') {
        result[i] = candidate
        break
      }
    }
  }

  return result
}

export const languageLabel = (language: string): 'HI' | 'EN' | 'GL' => {
  if (language === 'hi') return 'HI'
  if (language === 'en') return 'EN'
  return 'GL'
}

export const toRankedMovie = (item: ScorableItem, nowMs: number, rank?: number): Movie => {
  const year = Number.isFinite(daysSince(item.date, nowMs))
    ? new Date(item.date).getFullYear()
    : undefined

  return {
    id: String(item.id),
    title: item.title,
    hindiTitle:
      item.originalTitle && item.originalTitle !== item.title ? item.originalTitle : undefined,
    poster: getImageUrl(item.posterPath, 'w342'),
    genre: genreNamesFor(item.genreIds),
    year,
    rating: Math.round(item.rating * 10) / 10,
    quality: item.rating >= 7.5 ? '4K' : 'HD',
    rank,
    mediaType: item.mediaType,
    isNew: ageDaysFor(item, nowMs) <= NEW_WINDOW_DAYS,
    language: languageLabel(item.originalLanguage),
  }
}
