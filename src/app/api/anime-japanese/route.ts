import { NextRequest, NextResponse } from 'next/server'
import { getTitleBasics } from '@/lib/tmdb'
import { resolveAniListId } from '@/lib/animeIds'
import { rateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

type Provider = 'vidhawk' | 'animeembed' | 'megaplay'

const PROVIDERS: Record<Provider, { label: string; server: string; build: (id: number, episode: number) => string }> = {
  vidhawk: {
    label: 'VidHawk',
    server: 'Japanese',
    build: (id, episode) => `https://vidhawk.buzz/embed/ani/${id}/${episode}/japanese`,
  },
  animeembed: {
    label: 'AnimeEmbed',
    server: 'Sub',
    build: (id, episode) => `https://animeembed.com/embed/ani/${id}/${episode}?track=sub`,
  },
  megaplay: {
    label: 'MegaPlay',
    server: 'Sub',
    build: (id, episode) => `https://megaplay.buzz/stream/ani/${id}/${episode}/sub`,
  },
}

const cache = new Map<string, { expiresAt: number; value: Record<string, unknown> }>()
const CACHE_TTL_MS = 10 * 60 * 1000

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, 'anime-japanese', 30, 60_000)
  if (limited) return limited

  const params = request.nextUrl.searchParams
  const mediaType = params.get('type') === 'movie' ? 'movie' : 'tv'
  const tmdbId = params.get('tmdbId') || ''
  const requestedProvider = params.get('provider') || ''
  const provider = requestedProvider as Provider

  if (!/^\d{1,9}$/.test(tmdbId)) {
    return NextResponse.json({ error: 'invalid_tmdb_id' }, { status: 400 })
  }
  if (!Object.prototype.hasOwnProperty.call(PROVIDERS, provider)) {
    return NextResponse.json({ error: 'invalid_provider' }, { status: 400 })
  }

  const season = Math.min(Math.max(Number(params.get('season')) || 1, 1), 500)
  const episode = Math.min(Math.max(Number(params.get('episode')) || 1, 1), 10_000)
  const cacheKey = `${mediaType}:${tmdbId}:${season}:${episode}:${provider}`

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

    const resolved = await resolveAniListId({ titles, mediaType, season, episode })
    if (!resolved) {
      return NextResponse.json({ error: 'anime_not_indexed' }, { status: 404 })
    }

    const config = PROVIDERS[provider]
    const payload = {
      url: config.build(resolved.id, resolved.episode),
      mode: 'iframe',
      provider: config.label,
      server: config.server,
      verified: false,
      anilistId: resolved.id,
      animeTitle: resolved.title,
      episode: resolved.episode,
    }

    if (cache.size > 200) cache.clear()
    cache.set(cacheKey, { value: payload, expiresAt: Date.now() + CACHE_TTL_MS })

    return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: 'provider_unavailable' }, { status: 502 })
  }
}
