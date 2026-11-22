import { getMovieDetails, getTVDetails } from '@/lib/tmdb'
import { assertPublicUrl, isPublicHttpsUrl, USER_AGENT } from '@/lib/safeUrl'

export type HindiAnimeProvider = 'hindidub.site' | 'hindidubanime.com'
export type HindiAnimeMode = 'iframe' | 'hls' | 'file'
export type HindiAnimePreference = 'auto' | 'hindidub' | 'hd'

export interface HindiAnimeCandidate {
  label: string
  url: string
  mode: HindiAnimeMode
}

export interface HindiAnimeResult extends HindiAnimeCandidate {
  provider: HindiAnimeProvider
  verified: boolean
  candidates: HindiAnimeCandidate[]
}

interface ResolveOptions {
  tmdbId: string
  mediaType: 'movie' | 'tv'
  season: number
  episode: number
  prefer?: HindiAnimePreference
}

interface HindidubSearchItem {
  id?: string
  title?: string
  type?: string
  slug?: string
  original_language?: string
}

interface HindidubRawSource {
  url?: string
  label?: string
  type?: string
}

interface HindidubEpisode {
  season?: number
  episode?: number
  sources?: HindidubRawSource[]
}

interface HindidubDetails {
  movieSources?: HindidubRawSource[]
}

const HINDIDUB_BASE = 'https://hindidub.site'
const HDANIME_BASE = 'https://hindidubanime.com'
const CACHE_TTL_MS = 5 * 60 * 1000

const HINDIDUB_HEADERS: Record<string, string> = {
  'User-Agent': USER_AGENT,
  Accept: 'application/json, text/plain, */*',
  Referer: `${HINDIDUB_BASE}/`,
  Origin: HINDIDUB_BASE,
}

const HDANIME_HEADERS: Record<string, string> = {
  'User-Agent': USER_AGENT,
  Accept: 'text/html,application/json',
  Referer: `${HDANIME_BASE}/`,
}

const resolveCache = new Map<string, { value: HindiAnimeResult; expiresAt: number }>()
const hindidubSearchCache = new Map<string, { value: HindidubSearchItem[]; expiresAt: number }>()
const hindidubEpisodeCache = new Map<string, { value: HindidubEpisode[]; expiresAt: number }>()

const getCached = <T>(cache: Map<string, { value: T; expiresAt: number }>, key: string) => {
  const item = cache.get(key)
  if (!item) return null
  if (item.expiresAt <= Date.now()) {
    cache.delete(key)
    return null
  }
  return item.value
}

const setCached = <T>(cache: Map<string, { value: T; expiresAt: number }>, key: string, value: T) => {
  if (cache.size > 200) cache.clear()
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
}

const deaccent = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const normalizeTitle = (value: string) => deaccent(value)
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/hindi\s*(dubbed|subbed|dub|sub)/g, ' ')
  .replace(/\b(eng(?:lish)?|jap(?:anese)?|tamil|telugu|malayalam)[- ]*(dub|sub|dubbed|subbed)?\b/g, ' ')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const titleTokens = (value: string) => new Set(normalizeTitle(value).split(' ').filter(Boolean))

const titleOverlap = (left: string, right: string) => {
  const a = titleTokens(left)
  const b = titleTokens(right)
  if (!a.size || !b.size) return 0
  let shared = 0
  a.forEach((token) => { if (b.has(token)) shared += 1 })
  return shared / Math.max(a.size, b.size)
}

const slugify = (value: string) => normalizeTitle(value).replace(/ /g, '-')

const titleVariants = (titles: string[]) => {
  const variants = new Set<string>()
  for (const title of titles) {
    const clean = title.trim()
    if (!clean) continue
    variants.add(clean)
    const beforeColon = clean.split(':')[0]?.trim()
    if (beforeColon && beforeColon.length >= 3) variants.add(beforeColon)
    const withoutSeason = clean.replace(/\s*[-–—]?\s*(season|s)\s*\d+.*$/i, '').trim()
    if (withoutSeason && withoutSeason.length >= 3) variants.add(withoutSeason)
  }
  return Array.from(variants).slice(0, 6)
}

const fetchJson = async <T>(url: string, headers: Record<string, string>): Promise<T> => {
  const response = await fetch(url, {
    headers,
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`Request failed with ${response.status}`)
  return response.json() as Promise<T>
}

const fetchText = async (url: string, headers: Record<string, string>) => {
  const response = await fetch(url, {
    headers,
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`Request failed with ${response.status}`)
  return response.text()
}

const probe = async (candidate: HindiAnimeCandidate, referer: string) => {
  if (!isPublicHttpsUrl(candidate.url)) return false
  try {
    const url = new URL(candidate.url)
    await assertPublicUrl(url)
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: '*/*',
        Referer: referer,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(1_500),
    })
    return (response.status >= 200 && response.status < 400) || response.status === 405
  } catch {
    return false
  }
}

const pickReachable = async (candidates: HindiAnimeCandidate[], referer: string) => {
  if (!candidates.length) return null
  const results = await Promise.all(
    candidates.slice(0, 3).map(async (candidate) => ({
      candidate,
      reachable: await probe(candidate, referer),
    }))
  )
  const working = results.find((entry) => entry.reachable)
  if (working) return { ...working.candidate, verified: true }
  return { ...candidates[0], verified: false }
}

const modeForSource = (source: HindidubRawSource, url: string): HindiAnimeMode => {
  const kind = String(source.type || '').toLowerCase()
  const path = (() => {
    try { return new URL(url).pathname.toLowerCase() } catch { return '' }
  })()
  if (kind.includes('mp4') || path.endsWith('.mp4')) return 'file'
  if (kind.includes('hls') || path.endsWith('.m3u8')) return 'hls'
  return 'iframe'
}

const hindidubRank = (label: string) => {
  const value = label.toLowerCase()
  const order = [
    ['play', 10],
    ['multiq', 20],
    ['ruby', 30],
    ['turbo', 40],
    ['moly', 50],
    ['vidc', 60],
    ['vidara', 70],
    ['voe', 80],
    ['short', 90],
    ['cloudy', 100],
    ['watch', 110],
    ['dl', 110],
    ['fhd', 120],
    ['hd', 121],
    ['sd', 122],
    ['cine', 200],
  ] as const
  for (const [key, rank] of order) {
    if (value.includes(key)) return rank
  }
  return 150
}

const normalizeHindidubSources = (sources: HindidubRawSource[]) => {
  const candidates: HindiAnimeCandidate[] = []
  const seen = new Set<string>()
  for (const source of sources) {
    const label = String(source.label || 'Server').trim()
    const url = String(source.url || '').trim()
    if (!url || seen.has(url)) continue
    if (!isPublicHttpsUrl(url)) continue
    const value = label.toLowerCase()
    if (value.includes('vidstream') || value.includes('strmup')) continue
    seen.add(url)
    candidates.push({ label, url, mode: modeForSource(source, url) })
  }
  return candidates.sort((a, b) => hindidubRank(a.label) - hindidubRank(b.label))
}

const searchHindidub = async (query: string) => {
  const key = normalizeTitle(query)
  const cached = getCached(hindidubSearchCache, key)
  if (cached) return cached
  const data = await fetchJson<unknown>(
    `${HINDIDUB_BASE}/api/v1/search?q=${encodeURIComponent(query)}`,
    HINDIDUB_HEADERS
  )
  const items = Array.isArray(data)
    ? data
    : Array.isArray((data as { results?: unknown })?.results)
      ? (data as { results: HindidubSearchItem[] }).results
      : []
  setCached(hindidubSearchCache, key, items as HindidubSearchItem[])
  return items as HindidubSearchItem[]
}

const fetchHindidubEpisodes = async (animeId: string, season: number, episode: number) => {
  const cached = getCached(hindidubEpisodeCache, animeId)
  if (cached) return cached
  const data = await fetchJson<unknown>(
    `${HINDIDUB_BASE}/api/v1/episodes?animeId=${encodeURIComponent(animeId)}&season=${season}&episode=${episode}`,
    HINDIDUB_HEADERS
  )
  const episodes = Array.isArray(data)
    ? data
    : Array.isArray((data as { episodes?: unknown })?.episodes)
      ? (data as { episodes: HindidubEpisode[] }).episodes
      : []
  setCached(hindidubEpisodeCache, animeId, episodes as HindidubEpisode[])
  return episodes as HindidubEpisode[]
}

const selectEpisode = (episodes: HindidubEpisode[], season: number, episode: number) => {
  const exact = episodes.find(
    (item) => Number(item.season) === season && Number(item.episode) === episode
  )
  if (exact) return exact

  const seasonEpisodes = episodes
    .filter((item) => Number(item.season) === season)
    .sort((a, b) => Number(a.episode) - Number(b.episode))
  if (seasonEpisodes.length && episode > 0 && episode <= seasonEpisodes.length) {
    return seasonEpisodes[episode - 1]
  }

  return episodes.find((item) => Number(item.episode) === episode)
}

const resolveHindidub = async (
  titles: string[],
  mediaType: 'movie' | 'tv',
  season: number,
  episode: number
): Promise<HindiAnimeResult | null> => {
  let unverified: HindiAnimeResult | null = null
  const seenAnime = new Set<string>()

  for (const query of titleVariants(titles).slice(0, 3)) {
    let results: HindidubSearchItem[] = []
    try {
      results = await searchHindidub(query)
    } catch {
      continue
    }

    const ranked = results
      .map((item) => {
        const itemType = item.type === 'movie' ? 'movie' : 'tv'
        let score = titleOverlap(query, item.title || item.slug || '') * 100
        const title = String(item.title || '')
        if (itemType === mediaType) score += 40
        if (String(item.id || '').startsWith('toon_')) score += 30
        if (String(item.slug || '').includes('hindi-dub')) score += 25
        if (String(item.slug || '').includes('hindi')) score += 10
        if (String(item.id || '').startsWith('animekai_')) score -= 15
        if (item.original_language === 'ja') score += 5
        return { item, score, match: titleOverlap(query, title || item.slug || '') }
      })
      .filter((entry) => entry.match >= 0.28)
      .sort((a, b) => b.score - a.score)

    for (const entry of ranked.slice(0, 4)) {
      const animeId = String(entry.item.id || '')
      if (!animeId || seenAnime.has(animeId)) continue
      seenAnime.add(animeId)

      let rawSources: HindidubRawSource[] = []
      try {
        if (mediaType === 'movie') {
          const details = await fetchJson<HindidubDetails>(
            `${HINDIDUB_BASE}/api/v1/anime/details?id=${encodeURIComponent(animeId)}`,
            HINDIDUB_HEADERS
          )
          rawSources = details.movieSources || []
          if (!rawSources.length) {
            const episodes = await fetchHindidubEpisodes(animeId, 1, 1)
            const selected = episodes.find((item) => (item.sources || []).length)
            rawSources = selected?.sources || []
          }
        } else {
          const episodes = await fetchHindidubEpisodes(animeId, season, episode)
          const selected = selectEpisode(episodes, season, episode)
          rawSources = selected?.sources || []
        }
      } catch {
        continue
      }

      const candidates = normalizeHindidubSources(rawSources)
      if (!candidates.length) continue

      const picked = await pickReachable(candidates, `${HINDIDUB_BASE}/`)
      if (!picked) continue
      const result: HindiAnimeResult = {
        ...picked,
        provider: 'hindidub.site',
        candidates,
      }
      if (result.verified) return result
      if (!unverified) unverified = result
    }
  }

  return unverified
}

const lookupHindidubanimeExact = async (query: string, season: number) => {
  const base = slugify(query)
  if (!base) return null
  const suffixes = season ? ['', `-season-${season}`] : ['']
  for (const suffix of suffixes) {
    for (const kind of ['hindi-dubbed', 'hindi-subbed', '']) {
      const slug = `${base}${suffix}${kind ? `-${kind}` : ''}`
      const items = await fetchJson<unknown>(
        `${HDANIME_BASE}/wp-json/wp/v2/anime?slug=${encodeURIComponent(slug)}&_fields=id,slug,title,link`,
        HDANIME_HEADERS
      )
      if (Array.isArray(items) && items.length) {
        return items[0] as { slug: string; title?: { rendered?: string } }
      }
    }
  }
  return null
}

const searchHindidubanime = async (query: string) => {
  const items = await fetchJson<unknown>(
    `${HDANIME_BASE}/wp-json/wp/v2/anime?search=${encodeURIComponent(query)}&per_page=10&_fields=id,slug,title,link`,
    HDANIME_HEADERS
  )
  return Array.isArray(items) ? items as { slug: string; title?: { rendered?: string } }[] : []
}

const pickHindidubanime = (
  items: { slug: string; title?: { rendered?: string } }[],
  titles: string[],
  season: number
) => {
  if (!items.length) return null
  const best = items
    .map((item) => {
      const itemSeason = Number(item.slug.match(/season-(\d+)/)?.[1] || 0)
      const match = Math.max(...titles.map((title) => titleOverlap(title, item.title?.rendered || item.slug)))
      let score = match * 100
      if (season && itemSeason === season) score += 100
      else if (season && itemSeason) score -= 80
      if (item.slug.includes('hindi-dubbed')) score += 2
      return { item, score, match }
    })
    .sort((a, b) => b.score - a.score)[0]
  return best && best.match >= 0.34 ? best.item : null
}

const loadHindidubanimeEpisodes = async (animeSlug: string) => {
  const html = await fetchText(`${HDANIME_BASE}/anime/${animeSlug}/`, {
    ...HDANIME_HEADERS,
    Accept: 'text/html',
  })

  const episodes = new Map<number, string>()
  const re = /href=["'](?:https:\/\/hindidubanime\.com)?\/watch\/([^"']+)["']/g
  let match: RegExpExecArray | null
  while ((match = re.exec(html))) {
    const slug = match[1].replace(/\/$/, '')
    const number = Number(slug.match(/episode-(\d+(?:\.\d+)?)/)?.[1] || 0)
    if (number) episodes.set(number, slug)
  }

  if (!episodes.size) {
    const items = await fetchJson<unknown>(
      `${HDANIME_BASE}/wp-json/wp/v2/episode?search=${encodeURIComponent(animeSlug)}&per_page=100&_fields=slug,link`,
      HDANIME_HEADERS
    )
    if (Array.isArray(items)) {
      for (const item of items as { slug?: string }[]) {
        const slug = String(item.slug || '')
        const number = Number(slug.match(/episode-(\d+(?:\.\d+)?)/)?.[1] || 0)
        if (number) episodes.set(number, slug)
      }
    }
  }

  return episodes
}

const parseHindidubanimeEmbeds = (html: string) => {
  const candidates: HindiAnimeCandidate[] = []
  const seen = new Set<string>()
  const matches = html.match(/data-embed-id=["']([^"']+)["']/g) || []
  for (const match of matches) {
    const raw = match.replace(/^data-embed-id=["']/, '').replace(/["']$/, '')
    const separator = raw.indexOf(':')
    if (separator <= 0) continue
    const decode = (value: string) => {
      const padded = value + '='.repeat((4 - (value.length % 4)) % 4)
      return Buffer.from(padded, 'base64').toString('utf8').trim()
    }
    const label = decode(raw.slice(0, separator))
    let url = decode(raw.slice(separator + 1))
    if (!label || !url) continue
    if (/<iframe/i.test(url)) {
      const src = url.match(/src=["']([^"']+)["']/i)
      if (!src) continue
      url = src[1]
    }
    if (!isPublicHttpsUrl(url) || seen.has(url)) continue
    seen.add(url)
    candidates.push({ label, url, mode: 'iframe' })
  }
  return candidates.sort((a, b) => {
    const rank = (label: string) => {
      const value = label.toLowerCase()
      if (value.includes('fast')) return 10
      if (value.includes('cloud')) return 20
      if (value.includes('multi')) return 30
      return 40
    }
    return rank(a.label) - rank(b.label)
  })
}

const resolveHindidubanime = async (
  titles: string[],
  mediaType: 'movie' | 'tv',
  season: number,
  episode: number
): Promise<HindiAnimeResult | null> => {
  for (const query of titleVariants(titles).slice(0, 3)) {
    const exact = await lookupHindidubanimeExact(query, season).catch(() => null)
    let results = exact ? [exact] : []
    if (!results.length) {
      results = await searchHindidubanime(query).catch(() => [])
    }

    const anime = pickHindidubanime(results, titles, season)
    if (!anime) continue

    const episodes = await loadHindidubanimeEpisodes(anime.slug).catch(() => new Map<number, string>())
    let episodeSlug = ''
    if (mediaType === 'movie' && !episodes.size) {
      episodeSlug = anime.slug
    } else {
      const sorted = Array.from(episodes.entries()).sort((a, b) => a[0] - b[0])
      episodeSlug = episodes.get(episode) || sorted[episode - 1]?.[1] || ''
    }
    if (!episodeSlug) continue

    const watchUrl = `${HDANIME_BASE}/watch/${episodeSlug}/`
    const html = await fetchText(watchUrl, { ...HDANIME_HEADERS, Accept: 'text/html' }).catch(() => '')
    if (!html) continue

    const candidates = parseHindidubanimeEmbeds(html)
    if (!candidates.length) continue

    const picked = await pickReachable(candidates, `${HDANIME_BASE}/`)
    if (!picked) continue
    return {
      ...picked,
      provider: 'hindidubanime.com',
      candidates,
    }
  }

  return null
}

export async function resolveAnimeHindi({
  tmdbId,
  mediaType,
  season,
  episode,
  prefer = 'auto',
}: ResolveOptions): Promise<HindiAnimeResult | null> {
  const cacheKey = `${tmdbId}:${mediaType}:${season}:${episode}:${prefer}`
  const cached = getCached(resolveCache, cacheKey)
  if (cached) return cached

  const details = mediaType === 'tv'
    ? await getTVDetails(tmdbId)
    : await getMovieDetails(tmdbId)
  if (!details || details.success === false) return null

  const titles = [
    mediaType === 'tv' ? details.name : details.title,
    mediaType === 'tv' ? details.original_name : details.original_title,
    mediaType === 'tv' ? details.original_title : details.original_name,
  ].filter((value: unknown): value is string => typeof value === 'string' && Boolean(value.trim()))

  if (!titles.length) return null

  if (prefer === 'hindidub') {
    const result = await resolveHindidub(titles, mediaType, season, episode)
    if (result) setCached(resolveCache, cacheKey, result)
    return result
  }

  if (prefer === 'hd') {
    const result = await resolveHindidubanime(titles, mediaType, season, episode)
    if (result) setCached(resolveCache, cacheKey, result)
    return result
  }

  const primary = await resolveHindidub(titles, mediaType, season, episode)
  if (primary?.verified) {
    setCached(resolveCache, cacheKey, primary)
    return primary
  }

  const fallback = await resolveHindidubanime(titles, mediaType, season, episode)
  if (fallback) {
    setCached(resolveCache, cacheKey, fallback)
    return fallback
  }

  if (primary) setCached(resolveCache, cacheKey, primary)
  return primary
}
