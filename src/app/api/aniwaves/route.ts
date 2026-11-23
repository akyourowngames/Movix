import { NextRequest, NextResponse } from 'next/server'
import { getTitleBasics } from '@/lib/tmdb'
import { rateLimit } from '@/lib/rateLimit'
import { assertPublicUrl } from '@/lib/safeUrl'
import { buildAniWavesProxyUrl } from '@/lib/aniwavesProxy'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

const BASE = 'https://aniwaves.tv'
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'

const HTML_HEADERS = {
  'User-Agent': UA,
  Accept: 'text/html,application/xhtml+xml',
  Referer: `${BASE}/`,
}

const AJAX_HEADERS = {
  'User-Agent': UA,
  Accept: 'application/json, text/javascript, */*; q=0.01',
  'X-Requested-With': 'XMLHttpRequest',
}

interface AniWavesCard {
  slug: string
  title: string
}

interface AniWavesEpisode {
  number: number
  ids: string
}

interface AniWavesServer {
  name: string
  linkId: string
  type: string
}

const cache = new Map<string, { expiresAt: number; value: Record<string, unknown> }>()
const CACHE_TTL_MS = 10 * 60 * 1000

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

const decode = (value: string) => value
  .replace(/&#0?39;/g, "'")
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/<[^>]+>/g, '')
  .trim()

const seasonNumber = (value: string) => {
  const text = normalize(value)
  const match = text.match(/\bseason\s*(\d+)\b/) || text.match(/\b(\d+)(?:st|nd|rd|th)\s*season\b/)
  return match ? Number(match[1]) : 0
}

const fetchText = async (url: string, headers: Record<string, string>) => {
  const response = await fetch(url, {
    headers,
    cache: 'no-store',
    signal: AbortSignal.timeout(12_000),
  })
  if (!response.ok) throw new Error(`Request failed with ${response.status}`)
  return response.text()
}

const fetchJson = async <T>(url: string, headers: Record<string, string>): Promise<T> => {
  const response = await fetch(url, {
    headers,
    cache: 'no-store',
    signal: AbortSignal.timeout(12_000),
  })
  if (!response.ok) throw new Error(`Request failed with ${response.status}`)
  return response.json() as Promise<T>
}

const parseCards = (html: string) => {
  const cards = new Map<string, AniWavesCard>()
  const anchorRe = /<a\b[^>]*class="[^"]*name d-title[^"]*"[^>]*>([\s\S]*?)<\/a>/gi
  let match: RegExpExecArray | null
  while ((match = anchorRe.exec(html))) {
    const tag = match[0]
    const href = tag.match(/href="\/watch\/([^"]+)"/i)?.[1]
    if (!href) continue
    const title = decode(match[1])
    if (title) cards.set(href, { slug: href, title })
  }
  return Array.from(cards.values())
}

const parseEpisodes = (html: string) => {
  const episodes: AniWavesEpisode[] = []
  const tagRe = /<a\b[^>]*>/gi
  let match: RegExpExecArray | null
  while ((match = tagRe.exec(html))) {
    const tag = match[0]
    const num = tag.match(/data-num="([^"]+)"/i)?.[1]
    const ids = tag.match(/data-ids="([^"]+)"/i)?.[1]
    if (!num || !ids) continue
    const number = Number(num)
    if (!Number.isFinite(number)) continue
    episodes.push({ number, ids: ids.replace(/&amp;/g, '&') })
  }
  return episodes
}

const parseServers = (html: string) => {
  const servers: AniWavesServer[] = []
  const blockRe = /<div class="type" data-type="([^"]+)">([\s\S]*?)<\/ul>/gi
  let block: RegExpExecArray | null
  while ((block = blockRe.exec(html))) {
    const type = block[1]
    const body = block[2]
    const liRe = /<li\b[^>]*data-link-id="([^"]+)"[^>]*>([\s\S]*?)<\/li>/gi
    let li: RegExpExecArray | null
    while ((li = liRe.exec(body))) {
      const name = decode(li[2])
      if (name) servers.push({ name, linkId: li[1], type })
    }
  }
  return servers
}

const serverRank = (server: AniWavesServer) => {
  if (server.type === 'sub') return 0
  if (server.type === 'dub') return 10
  return 20
}

const serverNameRank = (server: AniWavesServer) => {
  const name = server.name.toLowerCase()
  if (name.includes('vidplay')) return 0
  if (name.includes('byfms')) return 1
  if (name.includes('dghg')) return 2
  return 10
}

const searchCards = async (query: string) => {
  const html = await fetchText(`${BASE}/filter?keyword=${encodeURIComponent(deaccent(query))}`, HTML_HEADERS)
  return parseCards(html)
}

const resolveVhsHls = async (playerUrl: string) => {
  const player = new URL(playerUrl)
  await assertPublicUrl(player)

  const html = await fetchText(playerUrl, {
    'User-Agent': UA,
    Accept: 'text/html,application/xhtml+xml',
    Referer: `${BASE}/`,
  })
  const sourceId = html.match(/data-id="([^"]+)"/i)?.[1]
  if (!sourceId) return null

  const api = new URL(`getSources?id=${encodeURIComponent(sourceId)}`, player)
  await assertPublicUrl(api)
  const data = await fetchJson<{
    sources?: string
    tracks?: { file?: string; kind?: string; label?: string }[]
  }>(api.toString(), {
    'User-Agent': UA,
    Accept: 'application/json',
    Referer: playerUrl,
  })

  const m3u8 = String(data.sources || '')
  if (!/^https:\/\//i.test(m3u8)) return null

  const subtitle = (data.tracks || []).find((track) => {
    const kind = `${track.kind || ''} ${track.label || ''}`.toLowerCase()
    return Boolean(track.file) && /subtitle|caption/.test(kind)
  })

  return {
    url: buildAniWavesProxyUrl(m3u8),
    subtitleSrc: subtitle?.file ? buildAniWavesProxyUrl(subtitle.file) : undefined,
  }
}

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, 'aniwaves', 30, 60_000)
  if (limited) return limited

  const params = request.nextUrl.searchParams
  const mediaType = params.get('type') === 'movie' ? 'movie' : 'tv'
  const tmdbId = params.get('tmdbId') || ''
  if (!/^\d{1,9}$/.test(tmdbId)) {
    return NextResponse.json({ error: 'invalid_tmdb_id' }, { status: 400 })
  }

  const season = Math.min(Math.max(Number(params.get('season')) || 1, 1), 500)
  const episode = Math.min(Math.max(Number(params.get('episode')) || 1, 1), 10_000)
  const seasonName = String(params.get('seasonName') || '').slice(0, 200)
  const cacheKey = `${mediaType}:${tmdbId}:${season}:${episode}:${normalize(seasonName)}`
  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.value, { headers: { 'Cache-Control': 'no-store' } })
  }

  try {
    const basics = await getTitleBasics(mediaType, tmdbId)
    if (!basics) {
      return NextResponse.json({ error: 'title_not_found' }, { status: 404 })
    }

    const titles = [
      mediaType === 'tv' ? basics.name : basics.title,
      mediaType === 'tv' ? basics.original_name : basics.original_title,
    ].filter((value: unknown): value is string => typeof value === 'string' && Boolean(value.trim()))

    const baseTitle = titles[0] || ''
    const seasonTitle = season > 1 && baseTitle ? `${baseTitle} Season ${season}` : ''
    const queries = Array.from(new Set([...titles.slice(0, 2), seasonTitle, seasonName].filter(Boolean)))

    const cards = new Map<string, AniWavesCard>()
    for (const query of queries) {
      try {
        const results = await searchCards(query)
        for (const card of results) cards.set(card.slug, card)
      } catch {
        // Try the next title variant.
      }
    }

    const ranked = Array.from(cards.values())
      .map((card) => {
        const match = Math.max(
          ...queries.map((query) => Math.max(overlap(query, card.title), overlap(query, card.slug))),
          0
        )
        const foundSeason = seasonNumber(`${card.title} ${card.slug}`)
        let score = match * 100
        if (season > 1) {
          if (foundSeason === season) score += 120
          else if (foundSeason) score -= 100
        } else if (season === 1) {
          if (foundSeason === 1) score += 20
          else if (foundSeason > 1) score -= 100
        }
        const seasonMatch = seasonName
          ? Math.max(overlap(seasonName, card.title), overlap(seasonName, card.slug))
          : 0
        if (seasonMatch >= 0.5) score += 120
        if (normalize(card.title) === normalize(baseTitle)) score += 15
        return { card, score, match }
      })
      .filter((entry) => entry.match >= 0.42 && entry.score >= 55)
      .sort((a, b) => b.score - a.score)

    for (const entry of ranked.slice(0, 4)) {
      const watchUrl = `${BASE}/watch/${entry.card.slug}`
      let watchHtml = ''
      try {
        watchHtml = await fetchText(watchUrl, HTML_HEADERS)
      } catch {
        continue
      }
      const animeId = watchHtml.match(/id="watch-main"[^>]*data-id="(\d+)"/i)?.[1]
      if (!animeId) continue

      const ajaxHeaders = { ...AJAX_HEADERS, Referer: watchUrl }
      let episodes: AniWavesEpisode[] = []
      try {
        const episodeData = await fetchJson<{ status?: number; result?: string }>(
          `${BASE}/ajax/episode/list/${animeId}`,
          ajaxHeaders
        )
        episodes = parseEpisodes(String(episodeData.result || ''))
      } catch {
        continue
      }
      if (!episodes.length) continue

      const exact = episodes.find((item) => item.number === episode)
      const sorted = episodes.slice().sort((a, b) => a.number - b.number)
      const selected = exact || sorted[episode - 1] || sorted[0]
      if (!selected) continue

      let servers: AniWavesServer[] = []
      try {
        const serverData = await fetchJson<{ status?: number; result?: string }>(
          `${BASE}/ajax/server/list?servers=${selected.ids}`,
          ajaxHeaders
        )
        servers = parseServers(String(serverData.result || ''))
      } catch {
        continue
      }
      if (!servers.length) continue

      servers.sort((a, b) => serverRank(a) - serverRank(b) || serverNameRank(a) - serverNameRank(b))
      for (const server of servers.slice(0, 4)) {
        try {
          const sourceData = await fetchJson<{ status?: number; result?: { url?: string } }>(
            `${BASE}/ajax/sources?id=${encodeURIComponent(server.linkId)}&asi=0&autoPlay=1`,
            ajaxHeaders
          )
          const playerUrl = sourceData.result?.url
          if (!playerUrl || !/^https:\/\//i.test(playerUrl)) continue

          const hls = await resolveVhsHls(playerUrl)
          if (!hls) continue

          const payload = {
            url: hls.url,
            mode: 'hls',
            provider: 'AniWaves',
            server: server.name === 'Vidplay' ? 'Main' : server.name,
            verified: true,
            episode: selected.number,
            subtitleSrc: hls.subtitleSrc,
          }
          if (cache.size > 200) cache.clear()
          cache.set(cacheKey, { value: payload, expiresAt: Date.now() + CACHE_TTL_MS })
          return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } })
        } catch {
          continue
        }
      }
    }

    return NextResponse.json({ error: 'stream_not_found' }, { status: 404 })
  } catch {
    return NextResponse.json({ error: 'provider_unavailable' }, { status: 502 })
  }
}
