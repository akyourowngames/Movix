import type { MetadataRoute } from 'next'
import { CATEGORIES, browsePathFor } from '@/lib/categories'
import { SITE_URL } from '@/lib/site'
import {
  getCatalogDiscover,
  getCatalogTrending,
  type TMDBMovie,
} from '@/lib/tmdb'

export const revalidate = 86400

const GENRE_ROUTES = ['28', '18', '35', '53', '10749', '27']

// Query strings must be XML-escaped inside <loc>; Next does not do this for us.
const sitemapUrl = (path: string) => `${SITE_URL}${path}`.replace(/&/g, '&amp;')

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/browse`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    ...GENRE_ROUTES.map((id) => ({
      url: `${SITE_URL}/genre/${id}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ]

  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((category) => ({
    url: sitemapUrl(browsePathFor('all', category.id)),
    lastModified: now,
    changeFrequency: 'daily',
    priority: category.group === 'spotlight' ? 0.8 : 0.7,
  }))

  let titleRoutes: MetadataRoute.Sitemap = []

  try {
    const [trendingMovies, trendingTv, topMovies, topTv] = await Promise.all([
      getCatalogTrending('movie', 1),
      getCatalogTrending('tv', 1),
      getCatalogDiscover('movie', {
        sort_by: 'vote_average.desc',
        'vote_count.gte': 500,
        page: 1,
      }),
      getCatalogDiscover('tv', {
        sort_by: 'vote_average.desc',
        'vote_count.gte': 300,
        page: 1,
      }),
    ])

    const sources: { type: 'movie' | 'tv'; results: TMDBMovie[] }[] = [
      { type: 'movie', results: trendingMovies.ok ? trendingMovies.data.results || [] : [] },
      { type: 'tv', results: trendingTv.ok ? trendingTv.data.results || [] : [] },
      { type: 'movie', results: topMovies.ok ? topMovies.data.results || [] : [] },
      { type: 'tv', results: topTv.ok ? topTv.data.results || [] : [] },
    ]

    const seen = new Set<string>()
    titleRoutes = sources
      .flatMap(({ type, results }) =>
        results.map((item) => ({ type, item }))
      )
      .filter(({ item }) => !item.adult)
      .filter(({ type, item }) => {
        const key = `${type}:${item.id}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 200)
      .map(({ type, item }) => ({
        url: `${SITE_URL}/${type === 'tv' ? 'tv' : 'movie'}/${item.id}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.65,
      }))
  } catch {
    // Keep the static sitemap if TMDB is unavailable.
  }

  return [...staticRoutes, ...categoryRoutes, ...titleRoutes]
}
