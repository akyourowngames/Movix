export interface AniListResolution {
  id: number
  episode: number
  title: string
  match: number
}

interface AniListMedia {
  id: number
  title?: {
    romaji?: string | null
    english?: string | null
    native?: string | null
  }
  synonyms?: string[]
  episodes?: number | null
  format?: string | null
  seasonYear?: number | null
  startDate?: { year?: number | null } | null
}

interface ResolveArgs {
  titles: string[]
  mediaType: 'movie' | 'tv'
  season: number
  episode: number
}

const ANILIST_ENDPOINT = 'https://graphql.anilist.co'
const CACHE_TTL_MS = 10 * 60 * 1000
const searchCache = new Map<string, { value: AniListMedia[]; expiresAt: number }>()

const ANILIST_QUERY = `
  query ($search: String) {
    Page(perPage: 10) {
      media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
        id
        title { romaji english native }
        synonyms
        episodes
        format
        seasonYear
        startDate { year }
      }
    }
  }
`

const deaccent = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const normalize = (value: string) => deaccent(value)
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const tokens = (value: string) => new Set(normalize(value).split(' ').filter(Boolean))

const overlap = (a: string, b: string) => {
  const left = tokens(a)
  const right = tokens(b)
  if (!left.size || !right.size) return 0
  let shared = 0
  left.forEach((token) => { if (right.has(token)) shared += 1 })
  return shared / Math.max(left.size, right.size)
}

const candidateText = (media: AniListMedia) =>
  [
    media.title?.english,
    media.title?.romaji,
    media.title?.native,
    ...(media.synonyms || []),
  ].filter(Boolean).join(' ')

const candidateTitles = (media: AniListMedia) =>
  [
    media.title?.english,
    media.title?.romaji,
    media.title?.native,
    ...(media.synonyms || []),
  ].filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))

const seasonNumber = (media: AniListMedia) => {
  const text = normalize(candidateText(media))
  const patterns = [
    /\bseason\s*(\d+)\b/,
    /\b(\d+)(?:st|nd|rd|th)\s*season\b/,
    /\bpart\s*(\d+)\b/,
    /\bcour\s*(\d+)\b/,
    /\b(?:kny|snk|aot|jjk)\s*(\d+)\b/,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return Number(match[1])
  }
  return 0
}

const searchAniList = async (search: string) => {
  const key = normalize(search)
  const cached = searchCache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  const response = await fetch(ANILIST_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query: ANILIST_QUERY, variables: { search: deaccent(search) } }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`AniList request failed with ${response.status}`)
  const payload = await response.json()
  const media: AniListMedia[] = payload?.data?.Page?.media || []
  if (searchCache.size > 150) searchCache.clear()
  searchCache.set(key, { value: media, expiresAt: Date.now() + CACHE_TTL_MS })
  return media
}

const scoreMedia = (
  media: AniListMedia,
  titles: string[],
  mediaType: 'movie' | 'tv',
  season: number,
  episode: number
) => {
  const names = candidateTitles(media)
  const match = names.length
    ? Math.max(...names.flatMap((name) => titles.map((title) => overlap(title, name))))
    : 0
  const foundSeason = seasonNumber(media)
  const format = String(media.format || '').toUpperCase()

  let score = match * 100
  if (mediaType === 'tv') {
    if (format === 'TV') score += 30
    else if (format === 'ONA') score += 10
    else if (format === 'MOVIE') score -= 30
    else score -= 20
  } else {
    if (format === 'MOVIE') score += 60
    else if (format === 'SPECIAL') score += 10
    else score -= 30
  }

  if (season > 1) {
    if (foundSeason === season) score += 140
    else if (foundSeason) score -= 100
  } else if (season === 1) {
    if (foundSeason === 1) score += 20
    else if (foundSeason > 1) score -= 100
  }

  if (mediaType === 'tv' && media.episodes != null) {
    if (media.episodes >= episode) score += 20
    else score -= 10
  }

  return { score, match, foundSeason }
}

export async function resolveAniListId({
  titles,
  mediaType,
  season,
  episode,
}: ResolveArgs): Promise<AniListResolution | null> {
  const cleanTitles = Array.from(new Set(titles.map((title) => title.trim()).filter(Boolean)))
  if (!cleanTitles.length) return null

  const seasonTitle = season > 1 && cleanTitles[0] ? `${cleanTitles[0]} Season ${season}` : ''
  const queries = Array.from(new Set([...cleanTitles.slice(0, 2), seasonTitle].filter(Boolean)))
  const candidates = new Map<number, AniListMedia>()

  for (const query of queries) {
    try {
      const media = await searchAniList(query)
      for (const item of media) candidates.set(item.id, item)
    } catch {
      // Try the next title variant.
    }
  }

  if (!candidates.size) return null

  const ranked = Array.from(candidates.values())
    .map((media) => ({
      media,
      ...scoreMedia(media, cleanTitles, mediaType, season, episode),
    }))
    .filter((entry) => entry.match >= 0.42 && entry.score >= 55)
    .sort((a, b) => b.score - a.score)

  const best = ranked[0]
  if (!best) return null

  return {
    id: best.media.id,
    episode: mediaType === 'movie' ? 1 : episode,
    title: best.media.title?.english || best.media.title?.romaji || best.media.title?.native || '',
    match: best.match,
  }
}
