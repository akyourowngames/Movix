import { NextRequest, NextResponse } from 'next/server'
import { searchCatalog, type TMDBMovie, type TitleLanguage } from '@/lib/tmdb'
import { toCatalogItem } from '@/lib/catalog'
import { rateLimit } from '@/lib/rateLimit'

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, 'search', 60, 60_000)
  if (limited) return limited

  const params = request.nextUrl.searchParams
  const query = (params.get('q') || '').trim()
  const type = params.get('type') === 'tv' ? 'tv' : params.get('type') === 'movie' ? 'movie' : 'both'
  const lang: TitleLanguage = params.get('lang') === 'hi' ? 'hi' : 'en'

  if (query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  // Bound user-controlled upstream queries to reduce abuse and provider cost.
  if (query.length > 100) {
    return NextResponse.json({ results: [], error: 'query_too_long' }, {
      status: 400,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  const requested = type === 'tv' ? ['tv'] : type === 'movie' ? ['movie'] : ['movie', 'tv']
  const responses = await Promise.all(
    requested.map((media) => searchCatalog(media as 'movie' | 'tv', query, lang))
  )

  const successful = responses.filter((response) => response.ok)
  if (successful.length === 0) {
    return NextResponse.json(
      { results: [], error: 'search_unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  const results = responses.flatMap((response, index) =>
    response.results.map((item: TMDBMovie) => toCatalogItem(item, requested[index] as 'movie' | 'tv'))
  )

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
