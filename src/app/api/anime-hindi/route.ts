import { NextRequest, NextResponse } from 'next/server'
import { resolveAnimeHindi, type HindiAnimePreference } from '@/lib/hindiAnime'
import { rateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, 'anime-hindi', 30, 60_000)
  if (limited) return limited

  const params = request.nextUrl.searchParams
  const mediaType = params.get('type') === 'movie' ? 'movie' : 'tv'
  const tmdbId = params.get('tmdbId') || ''
  if (!/^\d{1,9}$/.test(tmdbId)) {
    return NextResponse.json({ error: 'invalid_tmdb_id' }, { status: 400 })
  }

  const season = Math.min(Math.max(Number(params.get('season')) || 1, 1), 500)
  const episode = Math.min(Math.max(Number(params.get('episode')) || 1, 1), 10_000)
  const requested = params.get('source')
  const prefer: HindiAnimePreference =
    requested === 'hindidub' || requested === 'hd' ? requested : 'auto'

  try {
    const result = await resolveAnimeHindi({
      tmdbId,
      mediaType,
      season,
      episode,
      prefer,
    })
    if (!result) {
      return NextResponse.json({ error: 'stream_not_found' }, { status: 404 })
    }
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: 'provider_unavailable' }, { status: 502 })
  }
}
