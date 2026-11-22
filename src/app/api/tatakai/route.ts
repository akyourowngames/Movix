import { NextRequest, NextResponse } from 'next/server'
import { getMovieDetails, getTVDetails, getSeasonEpisodes } from '@/lib/tmdb'
import { getTatakaiStream } from '@/lib/tatakai'

export const dynamic = 'force-dynamic'

const parseYear = (value?: string) => {
  const year = Number.parseInt(String(value || '').slice(0, 4), 10)
  return Number.isFinite(year) ? year : undefined
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const type = params.get('type') === 'tv' ? 'tv' : 'movie'
  const tmdbId = params.get('tmdbId') || ''

  if (!/^\d{1,9}$/.test(tmdbId)) {
    return NextResponse.json({ error: 'invalid_tmdb_id' }, { status: 400 })
  }

  const season = Math.min(Math.max(Number(params.get('season')) || 1, 1), 500)
  const episode = Math.min(Math.max(Number(params.get('episode')) || 1, 1), 10_000)

  try {
    let title = ''
    let alternateTitle = ''
    let year: number | undefined

    if (type === 'tv') {
      const show = await getTVDetails(tmdbId)
      if (!show || show.success === false) {
        return NextResponse.json({ error: 'title_not_found' }, { status: 404 })
      }
      title = show.name || show.original_name || ''
      alternateTitle = show.original_name || ''
      year = parseYear(show.first_air_date)

      if (season > 1) {
        try {
          const seasonData = await getSeasonEpisodes(tmdbId, season)
          const firstAired = (seasonData?.episodes || []).find(
            (item: { air_date?: string }) => item.air_date
          )
          const seasonYear = parseYear(firstAired?.air_date)
          if (seasonYear) year = seasonYear
        } catch {
          // The series year is still a useful fallback.
        }
      }
    } else {
      const movie = await getMovieDetails(tmdbId)
      if (!movie || movie.success === false) {
        return NextResponse.json({ error: 'title_not_found' }, { status: 404 })
      }
      title = movie.title || movie.original_title || ''
      alternateTitle = movie.original_title || ''
      year = parseYear(movie.release_date)
    }

    if (!title) {
      return NextResponse.json({ error: 'title_not_found' }, { status: 404 })
    }

    const stream = await getTatakaiStream({
      tmdbId,
      title,
      alternateTitle,
      year,
      isTV: type === 'tv',
      season,
      episode: type === 'tv' ? episode : 1,
    })

    if (!stream) {
      return NextResponse.json({ error: 'stream_not_found' }, { status: 404 })
    }

    return NextResponse.json(stream, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    return NextResponse.json({ error: 'provider_unavailable' }, { status: 502 })
  }
}
