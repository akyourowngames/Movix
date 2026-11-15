import { NextRequest, NextResponse } from 'next/server'
import { searchMovies, searchWebSeries, type TMDBMovie } from '@/lib/tmdb'
import { toCatalogItem } from '@/lib/catalog'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const query = (params.get('q') || '').trim()
  const type = params.get('type') === 'tv' ? 'tv' : params.get('type') === 'movie' ? 'movie' : 'both'

  if (query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const [movieData, tvData] = await Promise.all([
    type === 'tv' ? null : searchMovies(query),
    type === 'movie' ? null : searchWebSeries(query),
  ])

  const results = [
    ...(movieData?.results || []).map((item: TMDBMovie) =>
      toCatalogItem(item, 'movie')
    ),
    ...(tvData?.results || []).map((item: TMDBMovie) =>
      toCatalogItem(item, 'tv')
    ),
  ]

  return NextResponse.json(
    { results },
    {
      headers: {
        'Cache-Control':
          'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
      },
    }
  )
}
