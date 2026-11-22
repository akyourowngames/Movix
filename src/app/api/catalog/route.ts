import { NextRequest, NextResponse } from 'next/server'
import { getCatalogPage } from '@/lib/catalogQuery'
import { parseCategoryMedia } from '@/lib/categories'
import { rateLimit } from '@/lib/rateLimit'

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, 'catalog', 120, 60_000)
  if (limited) return limited

  const params = request.nextUrl.searchParams
  const type = parseCategoryMedia(params.get('type'), 'movie')
  const result = await getCatalogPage({
    type,
    categoryId: params.get('category'),
    page: Number(params.get('page')),
  })

  if (!result.ok) {
    return NextResponse.json(
      { results: [], error: 'catalog_unavailable', type },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  const { page } = result

  return NextResponse.json(
    {
      results: page.items,
      totalPages: page.totalPages,
      totalResults: page.totalResults,
      category: page.category.id,
      type: page.type,
    },
    {
      headers: {
        'Cache-Control':
          'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  )
}
