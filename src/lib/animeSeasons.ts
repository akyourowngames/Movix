interface TmdbSeason {
  id: number
  name: string
  season_number: number
  episode_count: number
  air_date: string
  poster_path: string | null
}

interface TmdbShow {
  id: number
  name?: string
  original_name?: string
  number_of_seasons?: number
  number_of_episodes?: number
  poster_path?: string | null
  seasons?: TmdbSeason[]
  genres?: { id: number }[]
  original_language?: string
}

export interface SplitSeason extends TmdbSeason {
  source?: 'tmdb' | 'anilist'
  anilistId?: number
  image?: string
}

interface AniListMedia {
  id: number
  title?: { romaji?: string | null; english?: string | null; native?: string | null }
  synonyms?: string[]
  episodes?: number | null
  format?: string | null
  seasonYear?: number | null
  startDate?: { year?: number | null } | null
  bannerImage?: string | null
  coverImage?: { extraLarge?: string | null; large?: string | null } | null
}

const cache = new Map<string, { value: SplitSeason[]; expiresAt: number }>()
const CACHE_TTL_MS = 10 * 60 * 1000

const deaccent = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const normalize = (value: string) => deaccent(value)
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const mediaTitles = (media: AniListMedia) =>
  [media.title?.english, media.title?.romaji, media.title?.native, ...(media.synonyms || [])]
    .filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))

const seasonOrder = (media: AniListMedia) => {
  const text = normalize(`${media.title?.english || ''} ${media.title?.romaji || ''} ${(media.synonyms || []).join(' ')}`)
  const match = text.match(/\bseason\s*(\d+)\b/) || text.match(/\b(\d+)(?:st|nd|rd|th)\s*season\b/)
  return match ? Number(match[1]) : 0
}

const searchAniList = async (search: string) => {
  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      query: `
        query ($search: String) {
          Page(perPage: 12) {
            media(search: $search, type: ANIME) {
              id
              title { romaji english native }
              synonyms
              episodes
              format
              seasonYear
              startDate { year }
              bannerImage
              coverImage { extraLarge large }
            }
          }
        }
      `,
      variables: { search: deaccent(search) },
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`AniList request failed with ${response.status}`)
  const payload = await response.json()
  return (payload?.data?.Page?.media || []) as AniListMedia[]
}

const EXCLUDED_SEASON_TITLE =
  /\b(recap|movie|ova|special|picture drama|chronicle|junior high|lost girls|no regrets|parody|pilot|short|preview)\b/i

const isBaseTitle = (media: AniListMedia, titles: string[]) => {
  const names = mediaTitles(media).map(normalize)
  const bases = titles.map(normalize)
  return names.some((name) =>
    bases.some((base) => name === base || name.startsWith(`${base} `) || name.includes(` ${base} `))
  )
}

export async function getAnimeSeasons(show: TmdbShow, isAnime: boolean): Promise<SplitSeason[]> {
  if (!isAnime) return show.seasons || []

  const titles = [show.name, show.original_name].filter(
    (value): value is string => typeof value === 'string' && Boolean(value.trim())
  )
  if (!titles.length) return show.seasons || []

  const key = `${show.id}:${normalize(titles[0])}`
  const cached = cache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  const media: AniListMedia[] = []
  for (const title of titles.slice(0, 2)) {
    try {
      const results = await searchAniList(title)
      for (const item of results) media.push(item)
    } catch {
      // Try the next title variant.
    }
  }

  const unique = new Map<number, AniListMedia>()
  for (const item of media) unique.set(item.id, item)

  const selected = Array.from(unique.values())
    .filter((item) => String(item.format || '').toUpperCase() === 'TV')
    .filter((item) => Number(item.episodes) > 0)
    .filter((item) => !EXCLUDED_SEASON_TITLE.test(mediaTitles(item).join(' ')))
    .filter((item) => isBaseTitle(item, titles))
    .sort((a, b) => {
      const yearA = a.startDate?.year || a.seasonYear || 0
      const yearB = b.startDate?.year || b.seasonYear || 0
      return yearA - yearB || seasonOrder(a) - seasonOrder(b) || a.id - b.id
    })

  if (!selected.length) {
    cache.set(key, { value: show.seasons || [], expiresAt: Date.now() + CACHE_TTL_MS })
    return show.seasons || []
  }

  const seasons: SplitSeason[] = selected.map((item, index) => ({
    id: item.id,
    name: item.title?.english || item.title?.romaji || `Season ${index + 1}`,
    season_number: index + 1,
    episode_count: Number(item.episodes),
    air_date: item.startDate?.year ? `${item.startDate.year}-01-01` : '',
    poster_path: show.poster_path || null,
    source: 'anilist',
    anilistId: item.id,
    image: item.bannerImage || item.coverImage?.extraLarge || item.coverImage?.large || '',
  }))

  cache.set(key, { value: seasons, expiresAt: Date.now() + CACHE_TTL_MS })
  return seasons
}
