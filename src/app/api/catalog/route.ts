import { NextRequest, NextResponse } from 'next/server'
import {
  getNewReleases,
  getPopularShows,
  getTrendingHindi,
  getTrendingWebSeries,
  type TMDBMovie,
} from '@/lib/tmdb'
import { toCatalogItem } from '@/lib/catalog'

const SOURCES = {
  movie: {
    trending: getTrendingHindi,
    new: getNewReleases,
  },
  tv: {
    trending: getTrendingWebSeries,
    new: getPopularShows,
  },
} as const

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const type = params.get('type') === 'tv' ? 'tv' : 'movie'
  const filter = params.get('filter') === 'new' ? 'new' : 'trending'
  const page = Math.min(Math.max(Number(params.get('page')) || 1, 1), 20)

  const data = await SOURCES[type][filter](page)
  const results = (data.results || []).map((item: TMDBMovie) =>
    toCatalogItem(item, type)
  )

  return NextResponse.json(
    { results, totalPages: Math.min(data.total_pages || 1, 20) },
    {
      headers: {
        'Cache-Control':
          'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  )
}
