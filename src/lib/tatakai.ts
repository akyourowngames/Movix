import { buildTatakaiProxyUrl } from '@/lib/tatakaiProxy'

const ANILIST_ENDPOINT = 'https://graphql.anilist.co'
const TATAKAI_PREVIEW = 'https://api.tatakai.app/api/v3/toko/preview'
const TATAKAI_STREAM = 'https://api.tatakai.app/api/v3/toko/stream'
const RESOLVE_TTL_MS = 6 * 60 * 60 * 1000
const STREAM_TTL_MS = 2 * 60 * 1000

interface AniListMedia {
  id: number
  title?: { english?: string; romaji?: string; native?: string }
  startDate?: { year?: number }
  format?: string
}

interface ResolvedAnime {
  id: number
  english?: string
  romaji?: string
  native?: string
}

interface TatakaiPreview {
  provider?: string
  streamUrl?: string
  isHls?: boolean
  streamHeaders?: { Referer?: string }
}

interface TatakaiSource {
  url?: string
  provider?: string
  isHls?: boolean
  sourceType?: string
  headers?: { Referer?: string; referer?: string }
}

interface TatakaiStreamResponse {
  sources?: TatakaiSource[]
}

export interface TatakaiStream {
  url: string
  provider: string
  anilistId: number
  referer: string
  isHls: boolean
}

const resolveCache = new Map<string, { value: ResolvedAnime | null; expiresAt: number }>()
const streamCache = new Map<string, { value: TatakaiStream; expiresAt: number }>()

const normalizeTitle = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const deaccent = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const seasonInTitle = (title: string) => {
  const match =
    title.match(/\bseason\s*(\d+)\b/i) ||
    title.match(/\b(\d+)(?:st|nd|rd|th)\s*season\b/i)
  return match ? Number(match[1]) : null
}

const scoreMedia = (
  media: AniListMedia,
  targetTitle: string,
  year: number | undefined,
  season: number
) => {
  const titles = [media.title?.english, media.title?.romaji, media.title?.native].filter(
    (value): value is string => Boolean(value)
  )
  const target = normalizeTitle(targetTitle)

  let titleScore = 0
  for (const candidateRaw of titles) {
    const candidate = normalizeTitle(candidateRaw)
    if (!candidate) continue

    if (candidate === target) titleScore = Math.max(titleScore, 10)
    else if (candidate.startsWith(target) || target.startsWith(candidate)) {
      titleScore = Math.max(titleScore, 6)
    } else if (candidate.includes(target) || target.includes(candidate)) {
      titleScore = Math.max(titleScore, 3)
    } else {
      const targetWords = new Set(target.split(' '))
      let overlap = 0
      for (const word of candidate.split(' ')) {
        if (targetWords.has(word)) overlap += 1
      }
      if (overlap > 0) titleScore = Math.max(titleScore, Math.min(4, overlap))
    }
  }

  if (titleScore === 0) return 0

  let score = titleScore

  if (year && media.startDate?.year) {
    const diff = Math.abs(Number(media.startDate.year) - year)
    if (diff === 0) score += 5
    else if (diff <= 1) score += 3
    else if (diff <= 3) score += 1
    else score -= 2
  }

  if (season > 1) {
    const allTitles = titles.join(' ')
    const declaredSeason = seasonInTitle(allTitles)
    if (declaredSeason === season) score += 5
    else if (declaredSeason && declaredSeason !== season) score -= 6
    else if (new RegExp(`\\b${season}\\b`).test(allTitles)) score += 2
  }

  return score
}

async function anilistSearch(search: string, formats: string[]): Promise<AniListMedia[]> {
  const query = `
    query ($search: String, $formats: [MediaFormat]) {
      Page(page: 1, perPage: 12) {
        media(type: ANIME, search: $search, isAdult: false, format_in: $formats) {
          id
          title { english romaji native }
          startDate { year }
          format
        }
      }
    }
  `

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(ANILIST_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query, variables: { search, formats } }),
        cache: 'no-store',
        signal: AbortSignal.timeout(12_000),
      })
      if (response.status === 429 && attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 900 * (attempt + 1)))
        continue
      }
      if (!response.ok) return []
      const payload = await response.json()
      return payload?.data?.Page?.media || []
    } catch {
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  return []
}

async function resolveAnime({
  tmdbId,
  title,
  alternateTitle,
  year,
  isTV,
  season,
}: {
  tmdbId: string
  title: string
  alternateTitle?: string
  year?: number
  isTV: boolean
  season: number
}): Promise<ResolvedAnime | null> {
  const cacheKey = `${tmdbId}:${isTV ? 'tv' : 'movie'}:${season}`
  const cached = resolveCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  const formats = isTV ? ['TV', 'TV_SHORT', 'ONA'] : ['MOVIE']
  const titleCandidates = Array.from(
    new Set(
      [title, deaccent(title), alternateTitle, alternateTitle ? deaccent(alternateTitle) : '']
        .map((value) => String(value || '').trim())
        .filter(Boolean)
    )
  )
  const queries = Array.from(
    new Set(
      titleCandidates.flatMap((candidate) =>
        season > 1 ? [`${candidate} season ${season}`, candidate] : [candidate]
      )
    )
  ).slice(0, 8)
  let best: AniListMedia | null = null
  let bestScore = 0

  for (const query of queries) {
    const media = await anilistSearch(query, formats)
    for (const item of media) {
      const score = scoreMedia(item, title, year, season)
      if (score > bestScore) {
        bestScore = score
        best = item
      }
    }
    if (bestScore >= 15) break
  }

  const value = bestScore >= 6 && best
    ? {
        id: best.id,
        english: best.title?.english,
        romaji: best.title?.romaji,
        native: best.title?.native,
      }
    : null

  resolveCache.set(cacheKey, { value, expiresAt: Date.now() + RESOLVE_TTL_MS })
  return value
}

interface ResolvedSource {
  url: string
  provider: string
  referer: string
  isHls: boolean
}

const fetchPreview = async (params: URLSearchParams): Promise<ResolvedSource | null> => {
  try {
    const response = await fetch(`${TATAKAI_PREVIEW}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    })
    if (!response.ok) return null
    const data = (await response.json()) as TatakaiPreview
    if (!data.streamUrl) return null
    return {
      url: data.streamUrl,
      provider: String(data.provider || 'tatakai'),
      referer: String(data.streamHeaders?.Referer || 'https://megaplay.buzz/'),
      isHls: Boolean(data.isHls ?? /\.m3u8(?:\?|$)/i.test(data.streamUrl)),
    }
  } catch {
    return null
  }
}

const fetchMultiSource = async (params: URLSearchParams): Promise<ResolvedSource | null> => {
  try {
    const response = await fetch(`${TATAKAI_STREAM}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    })
    if (!response.ok) return null
    const data = (await response.json()) as TatakaiStreamResponse
    const source = (data.sources || []).find(
      (item) =>
        item.url &&
        /^https?:\/\//i.test(item.url) &&
        (item.isHls ||
          item.sourceType === 'hls' ||
          item.sourceType === 'mp4' ||
          /\.(mp4|m3u8)(?:\?|$)/i.test(item.url))
    )
    if (!source?.url) return null
    return {
      url: source.url,
      provider: String(source.provider || 'tatakai'),
      referer: String(source.headers?.Referer || source.headers?.referer || 'https://megaplay.buzz/'),
      isHls: Boolean(
        source.isHls ||
        source.sourceType === 'hls' ||
        /\.m3u8(?:\?|$)/i.test(source.url)
      ),
    }
  } catch {
    return null
  }
}

export async function getTatakaiStream({
  tmdbId,
  title,
  alternateTitle,
  year,
  isTV,
  season = 1,
  episode = 1,
}: {
  tmdbId: string
  title: string
  alternateTitle?: string
  year?: number
  isTV: boolean
  season?: number
  episode?: number
}): Promise<TatakaiStream | null> {
  const anime = await resolveAnime({ tmdbId, title, alternateTitle, year, isTV, season })
  if (!anime) return null

  const cacheKey = `${anime.id}:${episode}`
  const cached = streamCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  const params = new URLSearchParams({
    anilistId: String(anime.id),
    episode: String(episode),
  })

  const titles = Array.from(new Set(
    [title, deaccent(title), alternateTitle, anime.english, anime.romaji, anime.native]
      .map((value) => String(value || '').trim())
      .filter(Boolean)
  )).slice(0, 6)
  titles.forEach((value) => params.append('titles[]', value))

  const source = (await fetchPreview(params)) || (await fetchMultiSource(params))

  if (!source) return null

  const result: TatakaiStream = {
    url: buildTatakaiProxyUrl(source.url, source.referer),
    provider: source.provider,
    anilistId: anime.id,
    referer: source.referer,
    isHls: source.isHls,
  }

  streamCache.set(cacheKey, { value: result, expiresAt: Date.now() + STREAM_TTL_MS })
  return result
}
