import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

const STREMIO_BASE = 'https://opensubtitles-v3.strem.io/subtitles'
const CACHE_TTL_MS = 30 * 60 * 1000
const cache = new Map<string, { vtt: string; expiresAt: number }>()

interface StremioSubtitle {
  url?: string
  lang?: string
  subtitleFileName?: string
}

const srtToVtt = (text: string) => {
  const cleaned = text.replace(/^\uFEFF/, '').replace(/\r+/g, '')
  if (/^WEBVTT/.test(cleaned)) return cleaned
  return `WEBVTT\n\n${cleaned.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')}`
}

const parseYear = (value: string | null) => {
  const number = Number(value)
  return Number.isInteger(number) ? number : 0
}

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, 'subtitles', 60, 60_000)
  if (limited) return limited

  const params = request.nextUrl.searchParams
  const imdbId = String(params.get('imdbId') || '').trim()
  const type = params.get('type') === 'movie' ? 'movie' : 'tv'
  const season = Math.max(1, parseYear(params.get('season')) || 1)
  const episode = Math.max(1, parseYear(params.get('episode')) || 1)
  const lang = params.get('lang') === 'hi' ? 'hi' : 'en'

  if (!/^tt\d{7,9}$/.test(imdbId)) {
    return new NextResponse(null, { status: 204 })
  }

  const cacheKey = `${imdbId}:${type}:${season}:${episode}:${lang}`
  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return new NextResponse(cached.vtt, {
      headers: {
        'Content-Type': 'text/vtt; charset=utf-8',
        'Cache-Control': 'public, max-age=1800',
      },
    })
  }

  const stremioPath =
    type === 'movie'
      ? `${STREMIO_BASE}/movie/${imdbId}.json`
      : `${STREMIO_BASE}/series/${imdbId}:${season}:${episode}.json`

  let subtitles: StremioSubtitle[] = []
  try {
    const response = await fetch(stremioPath, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    })
    if (!response.ok) return new NextResponse(null, { status: 204 })
    const payload = await response.json()
    subtitles = Array.isArray(payload?.subtitles) ? payload.subtitles : []
  } catch {
    return new NextResponse(null, { status: 204 })
  }

  const preferredLangs =
    lang === 'hi' ? ['hin', 'hi'] : ['eng', 'en']

  const isWanted = (item: StremioSubtitle) => {
    const code = String(item.lang || '').toLowerCase()
    return preferredLangs.includes(code)
  }

  let candidates = subtitles.filter(isWanted)
  if (!candidates.length && lang === 'hi') {
    candidates = subtitles.filter((item) => ['eng', 'en'].includes(String(item.lang || '').toLowerCase()))
  }

  if (!candidates.length) {
    return new NextResponse(null, { status: 204 })
  }

  const seasonTag = `s${String(season).padStart(2, '0')}e${String(episode).padStart(2, '0')}`
  const episodeTag = `e${String(episode).padStart(2, '0')}`
  const score = (item: StremioSubtitle) => {
    const name = String(item.subtitleFileName || '').toLowerCase()
    let value = 0
    if (type === 'tv') {
      if (name.includes(seasonTag)) value += 5
      if (name.includes(episodeTag)) value += 2
    }
    if (String(item.lang || '').toLowerCase() === preferredLangs[0]) value += 2
    return value
  }

  const chosen = candidates
    .slice()
    .sort((a, b) => score(b) - score(a))
    .find((item) => Boolean(item.url))

  if (!chosen?.url) {
    return new NextResponse(null, { status: 204 })
  }

  let subtitleUrl: URL
  try {
    subtitleUrl = new URL(chosen.url)
    if (subtitleUrl.protocol !== 'https:' || !subtitleUrl.hostname.endsWith('.strem.io')) {
      return new NextResponse(null, { status: 204 })
    }
  } catch {
    return new NextResponse(null, { status: 204 })
  }

  let vtt = ''
  try {
    const response = await fetch(subtitleUrl, {
      headers: { Accept: 'text/plain,*/*' },
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    })
    if (!response.ok) return new NextResponse(null, { status: 204 })
    vtt = srtToVtt(await response.text())
  } catch {
    return new NextResponse(null, { status: 204 })
  }

  if (cache.size > 300) {
    const now = Date.now()
    cache.forEach((value, key) => {
      if (value.expiresAt <= now) cache.delete(key)
    })
    if (cache.size > 350) cache.clear()
  }
  cache.set(cacheKey, { vtt, expiresAt: Date.now() + CACHE_TTL_MS })

  return new NextResponse(vtt, {
    headers: {
      'Content-Type': 'text/vtt; charset=utf-8',
      'Cache-Control': 'public, max-age=1800',
    },
  })
}
