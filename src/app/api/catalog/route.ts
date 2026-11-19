import { NextRequest, NextResponse } from 'next/server'
import {
  getDiscoverMovies,
  getDiscoverTV,
  getTrendingMoviesDay,
  getTrendingTVDay,
  type DiscoverParams,
  type TMDBMovie,
} from '@/lib/tmdb'
import { toCatalogItem } from '@/lib/catalog'
import {
  categoryForMedia,
  supportsCategory,
  type CategoryDef,
  type CategoryMedia,
} from '@/lib/categories'

type Media = 'movie' | 'tv'

const fetchCategory = async (
  media: Media,
  category: CategoryDef,
  page: number,
  today: string
): Promise<{ results?: TMDBMovie[]; total_pages?: number; total_results?: number }> => {
  if (category.id === 'trending') {
    return media === 'movie' ? getTrendingMoviesDay(page) : getTrendingTVDay(page)
  }

  const params: DiscoverParams = {
    ...(category[media] ?? {}),
    page,
  }

  if (category.id === 'new') {
    if (media === 'movie') params['primary_release_date.lte'] = today
    else params['first_air_date.lte'] = today
  }

  return media === 'movie' ? getDiscoverMovies(params) : getDiscoverTV(params)
}

const interleave = (lists: { media: Media; items: TMDBMovie[] }[]) => {
  const ordered: { media: Media; raw: TMDBMovie }[] = []
  const longest = Math.max(...lists.map((list) => list.items.length))

  for (let index = 0; index < longest; index++) {
    for (const list of lists) {
      const raw = list.items[index]
      if (raw) ordered.push({ media: list.media, raw })
    }
  }

  return ordered
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const typeParam = params.get('type')
  const type: CategoryMedia =
    typeParam === 'tv' ? 'tv' : typeParam === 'all' ? 'all' : 'movie'
  const category = categoryForMedia(params.get('category'))
  const page = Math.min(Math.max(Number(params.get('page')) || 1, 1), 20)
  const today = new Date().toISOString().slice(0, 10)

  const requested: Media[] = type === 'all' ? ['movie', 'tv'] : [type]
  const active = requested.filter((media) => supportsCategory(category, media))

  if (active.length === 0) {
    return NextResponse.json(
      { results: [], totalPages: 0, category: category.id, type },
      { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=600' } }
    )
  }

  const responses = await Promise.all(
    active.map((media) => fetchCategory(media, category, page, today))
  )

  const lists = active.map((media, index) => ({
    media,
    items: (responses[index].results || []).filter((item) => !item.adult),
  }))

  let ordered: { media: Media; raw: TMDBMovie }[] = []

  if (lists.length === 1) {
    ordered = lists[0].items.map((raw) => ({ media: lists[0].media, raw }))
  } else if (category.id === 'trending') {
    ordered = interleave(lists)
  } else {
    ordered = lists
      .flatMap((list) => list.items.map((raw) => ({ media: list.media, raw })))
      .sort((a, b) => (b.raw.popularity ?? 0) - (a.raw.popularity ?? 0))
  }

  const seen = new Set<string>()
  const results = ordered
    .filter(({ media, raw }) => {
      const key = `${media}:${raw.id}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map(({ media, raw }) => toCatalogItem(raw, media))

  const pageCounts = responses.map((response) => response.total_pages || 1)
  const totalPages = Math.min(
    Math.min(...pageCounts),
    20
  )
  const totalResults = responses.reduce(
    (sum, response) => sum + (response.total_results ?? response.results?.length ?? 0),
    0
  )

  return NextResponse.json(
    { results, totalPages, totalResults, category: category.id, type },
    {
      headers: {
        'Cache-Control':
          'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  )
}
