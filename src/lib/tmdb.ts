import { cache } from 'react'

const KEY = process.env.NEXT_PUBLIC_TMDB_KEY
// api.themoviedb.org is unreachable/reset on some ISPs; api.tmdb.org serves the same API
const BASE = process.env.TMDB_API_BASE || 'https://api.tmdb.org/3'

// Retries transient network failures (ECONNRESET) and 5xx/429 responses
const fetchTMDB = async (url: string, revalidate?: number): Promise<Response | null> => {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(
        url,
        revalidate === undefined ? undefined : { next: { revalidate } }
      )
      if (res.ok || res.status === 404) return res
      if (res.status !== 429 && res.status < 500) return res
    } catch {
      // network error — retry below
    }
    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)))
    }
  }
  return null
}

export interface TMDBMovie {
  id: number
  title: string
  name?: string // For TV shows
  original_title: string
  original_name?: string // For TV shows
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  release_date: string
  first_air_date?: string // For TV shows
  last_air_date?: string // For TV shows
  vote_average: number
  vote_count?: number
  popularity?: number
  original_language?: string
  adult?: boolean
  video?: boolean
  genre_ids: number[]
  imdb_id?: string
}

// Trending Hindi movies
export const getTrendingHindi = async (page: number = 1) => {
  try {
    const res = await fetchTMDB(
      `${BASE}/discover/movie?api_key=${KEY}&with_original_language=hi&sort_by=popularity.desc&page=${page}`,
      3600
    )
    if (!res?.ok) return { results: [] }
    return res.json()
  } catch {
    return { results: [] }
  }
}

// New releases
export const getNewReleases = async (page: number = 1) => {
  try {
    const res = await fetchTMDB(
      `${BASE}/discover/movie?api_key=${KEY}&with_original_language=hi&sort_by=release_date.desc&page=${page}`,
      3600
    )
    if (!res?.ok) return { results: [] }
    return res.json()
  } catch {
    return { results: [] }
  }
}

// Search movies
export const searchMovies = async (query: string) => {
  try {
    const params = new URLSearchParams({ api_key: KEY || '', query, language: 'hi-IN' })
    const res = await fetchTMDB(
      `${BASE}/search/movie?${params.toString()}`
    )
    if (!res?.ok) return { results: [] }
    return res.json()
  } catch {
    return { results: [] }
  }
}

export const searchCatalog = async (
  media: 'movie' | 'tv',
  query: string
): Promise<{ ok: boolean; results: TMDBMovie[] }> => {
  const params = new URLSearchParams({ api_key: KEY || '', query, language: 'hi-IN' })
  const res = await fetchTMDB(`${BASE}/search/${media}?${params.toString()}`)
  if (!res?.ok) return { ok: false, results: [] }
  const data = await res.json()
  return { ok: true, results: (data.results || []) as TMDBMovie[] }
}

// Get movie details with IMDB ID
export const getMovieDetails = cache(async (tmdbId: string) => {
  if (!/^\d{1,9}$/.test(tmdbId)) return { success: false, status_code: 34 }

  const res = await fetchTMDB(
    `${BASE}/movie/${tmdbId}?api_key=${KEY}&append_to_response=external_ids,credits,similar`,
    3600
  )

  if (!res) throw new Error('TMDB movie request unavailable')
  if (res.status === 404) return { success: false, status_code: 34 }
  if (!res.ok) throw new Error(`TMDB movie request failed (${res.status})`)

  return res.json()
})

// Trending Hindi Web Series
export const getTrendingWebSeries = async (page: number = 1) => {
  try {
    const res = await fetchTMDB(
      `${BASE}/discover/tv?api_key=${KEY}&with_original_language=hi&with_origin_country=IN&sort_by=popularity.desc&page=${page}`,
      3600
    )
    if (!res?.ok) return { results: [] }
    return res.json()
  } catch {
    return { results: [] }
  }
}

// Popular Hindi OTT Shows
export const getPopularShows = async (page: number = 1) => {
  try {
    const res = await fetchTMDB(
      `${BASE}/discover/tv?api_key=${KEY}&with_original_language=hi&with_origin_country=IN&sort_by=vote_average.desc&vote_count.gte=100&page=${page}`,
      3600
    )
    if (!res?.ok) return { results: [] }
    return res.json()
  } catch {
    return { results: [] }
  }
}

// Movies by genre (Hindi only)
export const getMoviesByGenre = async (genreId: string) => {
  if (!/^\d{1,5}$/.test(genreId)) throw new Error('Invalid genre identifier')

  const res = await fetchTMDB(
    `${BASE}/discover/movie?api_key=${KEY}&with_genres=${genreId}&with_original_language=hi&sort_by=popularity.desc&page=1`,
    3600
  )

  if (!res) throw new Error('TMDB genre request unavailable')
  if (!res.ok) throw new Error(`TMDB genre request failed (${res.status})`)

  return res.json()
}

// Search TV shows
export const searchWebSeries = async (query: string) => {
  try {
    const params = new URLSearchParams({ api_key: KEY || '', query, language: 'hi-IN' })
    const res = await fetchTMDB(
      `${BASE}/search/tv?${params.toString()}`
    )
    if (!res?.ok) return { results: [] }
    return res.json()
  } catch {
    return { results: [] }
  }
}

// TV show detail + season info
export const getTVDetails = cache(async (tmdbId: string) => {
  if (!/^\d{1,9}$/.test(tmdbId)) return { success: false, status_code: 34 }

  const res = await fetchTMDB(
    `${BASE}/tv/${tmdbId}?api_key=${KEY}&append_to_response=external_ids,credits,similar`,
    3600
  )

  if (!res) throw new Error('TMDB TV request unavailable')
  if (res.status === 404) return { success: false, status_code: 34 }
  if (!res.ok) throw new Error(`TMDB TV request failed (${res.status})`)

  return res.json()
})

// Episodes in a season
export const getSeasonEpisodes = async (tmdbId: string, season: number) => {
  if (!/^\d{1,9}$/.test(tmdbId) || !Number.isInteger(season) || season < 0 || season > 500) {
    throw new Error('Invalid season request')
  }

  const res = await fetchTMDB(
    `${BASE}/tv/${tmdbId}/season/${season}?api_key=${KEY}`,
    3600
  )

  if (!res) throw new Error('TMDB season request unavailable')
  if (res.status === 404) return { episodes: [] }
  if (!res.ok) throw new Error(`TMDB season request failed (${res.status})`)

  return res.json()
}

// Short-window trending signals (the "today" source)
export const getTrendingMoviesDay = async (page: number = 1) => {
  try {
    const res = await fetchTMDB(
      `${BASE}/trending/movie/day?api_key=${KEY}&page=${page}`,
      900
    )
    if (!res?.ok) return { results: [] }
    return res.json()
  } catch {
    return { results: [] }
  }
}

export const getTrendingTVDay = async (page: number = 1) => {
  try {
    const res = await fetchTMDB(
      `${BASE}/trending/tv/day?api_key=${KEY}&page=${page}`,
      900
    )
    if (!res?.ok) return { results: [] }
    return res.json()
  } catch {
    return { results: [] }
  }
}

export const getTrendingMoviesWeek = async (page: number = 1) => {
  try {
    const res = await fetchTMDB(
      `${BASE}/trending/movie/week?api_key=${KEY}&page=${page}`,
      1800
    )
    if (!res?.ok) return { results: [] }
    return res.json()
  } catch {
    return { results: [] }
  }
}

export const getNowPlaying = async (page: number = 1) => {
  try {
    const res = await fetchTMDB(
      `${BASE}/movie/now_playing?api_key=${KEY}&page=${page}&region=IN`,
      1800
    )
    if (!res?.ok) return { results: [] }
    return res.json()
  } catch {
    return { results: [] }
  }
}

export const getOnTheAir = async (page: number = 1) => {
  try {
    const res = await fetchTMDB(
      `${BASE}/tv/on_the_air?api_key=${KEY}&page=${page}`,
      1800
    )
    if (!res?.ok) return { results: [] }
    return res.json()
  } catch {
    return { results: [] }
  }
}

export const getTopRatedMovies = async (page: number = 1) => {
  try {
    const res = await fetchTMDB(
      `${BASE}/movie/top_rated?api_key=${KEY}&page=${page}`,
      3600
    )
    if (!res?.ok) return { results: [] }
    return res.json()
  } catch {
    return { results: [] }
  }
}

export const getTopRatedTV = async (page: number = 1) => {
  try {
    const res = await fetchTMDB(
      `${BASE}/tv/top_rated?api_key=${KEY}&page=${page}`,
      3600
    )
    if (!res?.ok) return { results: [] }
    return res.json()
  } catch {
    return { results: [] }
  }
}

export const getMovieRecommendations = async (tmdbId: string): Promise<TMDBListResult> => {
  const res = await fetchTMDB(
    `${BASE}/movie/${tmdbId}/recommendations?api_key=${KEY}&page=1`,
    3600
  )
  if (!res?.ok) return { ok: false, results: [] }
  try {
    const data = await res.json()
    return { ok: true, results: (data.results || []) as TMDBMovie[] }
  } catch {
    return { ok: false, results: [] }
  }
}

export const getTVRecommendations = async (tmdbId: string): Promise<TMDBListResult> => {
  const res = await fetchTMDB(
    `${BASE}/tv/${tmdbId}/recommendations?api_key=${KEY}&page=1`,
    3600
  )
  if (!res?.ok) return { ok: false, results: [] }
  try {
    const data = await res.json()
    return { ok: true, results: (data.results || []) as TMDBMovie[] }
  } catch {
    return { ok: false, results: [] }
  }
}

// Only these parameters may reach /discover — callers never build the URL
const DISCOVER_KEYS = [
  'with_original_language',
  'with_origin_country',
  'with_genres',
  'primary_release_date.gte',
  'primary_release_date.lte',
  'first_air_date.gte',
  'first_air_date.lte',
  'vote_count.gte',
  'vote_count.lte',
  'vote_average.gte',
  'sort_by',
  'page',
] as const

export type DiscoverParams = Partial<
  Record<(typeof DISCOVER_KEYS)[number], string | number>
>

export type TMDBListResult = {
  ok: boolean
  results: TMDBMovie[]
}

const buildDiscoverUrl = (media: 'movie' | 'tv', params: DiscoverParams) => {
  const search = new URLSearchParams({ api_key: KEY || '' })
  for (const key of DISCOVER_KEYS) {
    const value = params[key]
    if (value !== undefined && value !== '') {
      search.set(key, String(value))
    }
  }
  return `${BASE}/discover/${media}?${search.toString()}`
}

export const getCatalogDiscover = async (
  media: 'movie' | 'tv',
  params: DiscoverParams
): Promise<{ ok: boolean; data: { results?: TMDBMovie[]; total_pages?: number; total_results?: number } }> => {
  const res = await fetchTMDB(buildDiscoverUrl(media, params), 1800)
  if (!res?.ok) return { ok: false, data: { results: [] } }
  return { ok: true, data: await res.json() }
}

export const getCatalogTrending = async (
  media: 'movie' | 'tv',
  page: number
): Promise<{ ok: boolean; data: { results?: TMDBMovie[]; total_pages?: number; total_results?: number } }> => {
  const search = new URLSearchParams({ api_key: KEY || '', page: String(page) })
  const res = await fetchTMDB(`${BASE}/trending/${media}/day?${search.toString()}`, 900)
  if (!res?.ok) return { ok: false, data: { results: [] } }
  return { ok: true, data: await res.json() }
}

export const getDiscoverMovies = async (params: DiscoverParams) => {
  const res = await fetchTMDB(buildDiscoverUrl('movie', params), 1800)
  if (!res?.ok) return { ok: false, results: [] } satisfies TMDBListResult
  try {
    const data = await res.json()
    return { ok: true, results: (data.results || []) as TMDBMovie[] } satisfies TMDBListResult
  } catch {
    return { ok: false, results: [] } satisfies TMDBListResult
  }
}

export const getDiscoverTV = async (params: DiscoverParams) => {
  const res = await fetchTMDB(buildDiscoverUrl('tv', params), 1800)
  if (!res?.ok) return { ok: false, results: [] } satisfies TMDBListResult
  try {
    const data = await res.json()
    return { ok: true, results: (data.results || []) as TMDBMovie[] } satisfies TMDBListResult
  } catch {
    return { ok: false, results: [] } satisfies TMDBListResult
  }
}
