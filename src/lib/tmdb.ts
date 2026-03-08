const KEY = process.env.NEXT_PUBLIC_TMDB_KEY
const BASE = 'https://api.themoviedb.org/3'
const IMG_BASE = 'https://image.tmdb.org/t/p'

export interface TMDBMovie {
  id: number
  title: string
  original_title: string
  poster_path: string
  backdrop_path: string
  overview: string
  release_date: string
  vote_average: number
  genre_ids: number[]
  imdb_id?: string
}

// Trending Hindi movies
export const getTrendingHindi = async (page: number = 1) => {
  try {
    const res = await fetch(
      `${BASE}/discover/movie?api_key=${KEY}&with_original_language=hi&sort_by=popularity.desc&page=${page}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return { results: [] }
    return res.json()
  } catch {
    return { results: [] }
  }
}

// New releases
export const getNewReleases = async (page: number = 1) => {
  try {
    const res = await fetch(
      `${BASE}/discover/movie?api_key=${KEY}&with_original_language=hi&sort_by=release_date.desc&page=${page}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return { results: [] }
    return res.json()
  } catch {
    return { results: [] }
  }
}

// Search movies
export const searchMovies = async (query: string) => {
  try {
    const res = await fetch(
      `${BASE}/search/movie?api_key=${KEY}&query=${query}&language=hi-IN`
    )
    if (!res.ok) return { results: [] }
    return res.json()
  } catch {
    return { results: [] }
  }
}

// Get movie details with IMDB ID
export const getMovieDetails = async (tmdbId: string) => {
  try {
    const res = await fetch(
      `${BASE}/movie/${tmdbId}?api_key=${KEY}&append_to_response=external_ids,credits,videos,similar`,
      { next: { revalidate: 3600 } }
    )
    
    if (!res.ok) {
      return null
    }
    
    return res.json()
  } catch {
    return null
  }
}

// Trending Hindi Web Series
export const getTrendingWebSeries = async (page: number = 1) => {
  try {
    const res = await fetch(
      `${BASE}/discover/tv?api_key=${KEY}&with_original_language=hi&with_origin_country=IN&sort_by=popularity.desc&page=${page}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return { results: [] }
    return res.json()
  } catch {
    return { results: [] }
  }
}

// Popular Hindi OTT Shows
export const getPopularShows = async (page: number = 1) => {
  try {
    const res = await fetch(
      `${BASE}/discover/tv?api_key=${KEY}&with_original_language=hi&with_origin_country=IN&sort_by=vote_average.desc&vote_count.gte=100&page=${page}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return { results: [] }
    return res.json()
  } catch {
    return { results: [] }
  }
}

// Search TV shows
export const searchWebSeries = async (query: string) => {
  try {
    const res = await fetch(
      `${BASE}/search/tv?api_key=${KEY}&query=${query}&language=hi-IN`
    )
    if (!res.ok) return { results: [] }
    return res.json()
  } catch {
    return { results: [] }
  }
}

// TV show detail + season info
export const getTVDetails = async (tmdbId: string) => {
  try {
    const res = await fetch(
      `${BASE}/tv/${tmdbId}?api_key=${KEY}&append_to_response=external_ids,credits,videos,similar`,
      { next: { revalidate: 3600 } }
    )
    
    if (!res.ok) {
      return null
    }
    
    return res.json()
  } catch {
    return null
  }
}

// Episodes in a season
export const getSeasonEpisodes = async (tmdbId: string, season: number) => {
  try {
    const res = await fetch(
      `${BASE}/tv/${tmdbId}/season/${season}?api_key=${KEY}`,
      { next: { revalidate: 3600 } }
    )
    
    if (!res.ok) {
      return { episodes: [] }
    }
    
    return res.json()
  } catch {
    return { episodes: [] }
  }
}

// Helper to get full image URL
export const getImageUrl = (path: string, size: 'w500' | 'original' = 'w500') => {
  if (!path) {
    // Return a gray placeholder data URL instead of missing file
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750"%3E%3Crect fill="%23111" width="500" height="750"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%23666"%3ENo Image%3C/text%3E%3C/svg%3E'
  }
  return `${IMG_BASE}/${size}${path}`
}
