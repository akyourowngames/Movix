import {
  getCatalogDiscover,
  getCatalogTrending,
  type DiscoverParams,
  type TMDBMovie,
} from '@/lib/tmdb'
import { toCatalogItem, type CatalogItem } from '@/lib/catalog'
import {
  categoryForMedia,
  supportsCategory,
  type CategoryDef,
  type CategoryMedia,
} from '@/lib/categories'

type Media = 'movie' | 'tv'

export interface CatalogPage {
  items: CatalogItem[]
  totalPages: number
  totalResults: number
  category: CategoryDef
  type: CategoryMedia
}

export type CatalogPageResult =
  | { ok: true; page: CatalogPage }
  | { ok: false; reason: 'unavailable' }

const fetchCategory = async (
  media: Media,
  category: CategoryDef,
  page: number,
  today: string
): Promise<{
  ok: boolean
  data: { results?: TMDBMovie[]; total_pages?: number; total_results?: number }
}> => {
  if (category.id === 'trending') return getCatalogTrending(media, page)

  const params: DiscoverParams = {
    ...(category[media] ?? {}),
    page,
  }

  if (category.id === 'new') {
    if (media === 'movie') params['primary_release_date.lte'] = today
    else params['first_air_date.lte'] = today
  }

  return getCatalogDiscover(media, params)
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

export async function getCatalogPage({
  type,
  categoryId,
  page: requestedPage,
}: {
  type: CategoryMedia
  categoryId?: string | null
  page?: number
}): Promise<CatalogPageResult> {
  const category = categoryForMedia(categoryId)
  const page = Math.min(Math.max(Number(requestedPage) || 1, 1), 20)
  const today = new Date().toISOString().slice(0, 10)

  const requested: Media[] = type === 'all' ? ['movie', 'tv'] : [type]
  const active = requested.filter((media) => supportsCategory(category, media))

  if (active.length === 0) {
    return {
      ok: true,
      page: { items: [], totalPages: 0, totalResults: 0, category, type },
    }
  }

  const settled = await Promise.all(
    active.map((media) => fetchCategory(media, category, page, today))
  )

  if (settled.every((response) => !response.ok)) {
    return { ok: false, reason: 'unavailable' }
  }

  const responses = settled.map((response) => response.data)

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
  const items = ordered
    .filter(({ media, raw }) => {
      const key = `${media}:${raw.id}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map(({ media, raw }) => toCatalogItem(raw, media))

  const pageCounts = responses.map((response) => response.total_pages || 1)
  const totalPages = Math.min(Math.min(...pageCounts), 20)
  const totalResults = responses.reduce(
    (sum, response) => sum + (response.total_results ?? response.results?.length ?? 0),
    0
  )

  return {
    ok: true,
    page: { items, totalPages, totalResults, category, type },
  }
}
