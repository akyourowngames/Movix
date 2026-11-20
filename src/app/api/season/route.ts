import { NextRequest, NextResponse } from 'next/server'
import { getSeasonEpisodes } from '@/lib/tmdb'

interface EpisodeLike {
  id: number
  name: string
  episode_number: number
  season_number: number
  overview: string
  still_path: string | null
  air_date: string
  runtime: number
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const tvId = params.get('tv')
  const seasonParam = params.get('season')
  const season = Number(seasonParam)

  // Validate path segments before using them in a provider URL.
  if (
    !tvId || !/^\d{1,9}$/.test(tvId) ||
    !seasonParam || !/^\d{1,3}$/.test(seasonParam) ||
    season < 0 || season > 500
  ) {
    return NextResponse.json(
      { episodes: [], error: 'invalid_params' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  let data
  try {
    data = await getSeasonEpisodes(tvId, season)
  } catch {
    return NextResponse.json(
      { episodes: [], error: 'season_unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    )
  }
  const episodes = (data.episodes || []).map((episode: EpisodeLike) => ({
    id: episode.id,
    name: episode.name,
    episode_number: episode.episode_number,
    season_number: episode.season_number,
    overview: episode.overview,
    still_path: episode.still_path,
    air_date: episode.air_date,
    runtime: episode.runtime,
  }))

  return NextResponse.json(
    { episodes },
    {
      headers: {
        'Cache-Control':
          'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800',
      },
    }
  )
}
