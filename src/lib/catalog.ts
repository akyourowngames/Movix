export interface CatalogItem {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  vote_average: number
  genre_ids: number[]
  original_language?: string
  media_type?: 'movie' | 'tv'
}

const IMG_BASE = 'https://image.tmdb.org/t/p'
const PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750"%3E%3Crect fill="%23111" width="500" height="750"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%23666"%3ENo Image%3C/text%3E%3C/svg%3E'

export const getImageUrl = (
  path: string | null | undefined,
  size: 'w342' | 'w500' | 'w780' | 'w1280' | 'original' = 'w500'
) => {
  if (!path) return PLACEHOLDER
  return `${IMG_BASE}/${size}${path}`
}

export const tmdbPosterPath = (poster: string | null | undefined) => {
  if (!poster) return null
  if (poster.startsWith('/')) return poster
  const match = poster.match(/image\.tmdb\.org\/t\/p\/[^/]+(\/.+)$/)
  return match ? match[1] : null
}

interface TMDBResultLike {
  id: number
  title?: string
  name?: string
  poster_path?: string | null
  release_date?: string
  first_air_date?: string
  vote_average?: number
  genre_ids?: number[]
  original_language?: string
}

export const toCatalogItem = (
  item: TMDBResultLike,
  mediaType?: 'movie' | 'tv'
): CatalogItem => ({
  id: item.id,
  title: item.title || item.name || 'Untitled',
  poster_path: item.poster_path ?? null,
  release_date: item.release_date || item.first_air_date || '',
  vote_average: item.vote_average ?? 0,
  genre_ids: item.genre_ids ?? [],
  original_language: item.original_language,
  ...(mediaType ? { media_type: mediaType } : {}),
})
