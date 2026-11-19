import type { DiscoverParams } from './tmdb'

export type CategoryGroup = 'spotlight' | 'industry' | 'genres'

export interface CategoryDef {
  id: string
  label: string
  hindi: string
  group: CategoryGroup
  blurb?: string
  movie?: DiscoverParams
  tv?: DiscoverParams
}

const hot = (minVotes: number): DiscoverParams => ({
  sort_by: 'popularity.desc',
  'vote_count.gte': minVotes,
})

export const CATEGORIES: CategoryDef[] = [
  // Spotlight
  {
    id: 'trending',
    label: 'Trending Now',
    hindi: 'अभी ट्रेंडिंग',
    group: 'spotlight',
    blurb: 'What everyone is watching right now',
    movie: {},
    tv: {},
  },
  {
    id: 'new',
    label: 'New Releases',
    hindi: 'नई रिलीज़',
    group: 'spotlight',
    blurb: 'Freshly released movies and shows',
    movie: { sort_by: 'primary_release_date.desc', 'vote_count.gte': 5 },
    tv: { sort_by: 'first_air_date.desc', 'vote_count.gte': 3 },
  },
  {
    id: 'top-rated',
    label: 'Top Rated',
    hindi: 'टॉप रेटेड',
    group: 'spotlight',
    blurb: 'The highest-rated titles of all time',
    movie: { sort_by: 'vote_average.desc', 'vote_count.gte': 500 },
    tv: { sort_by: 'vote_average.desc', 'vote_count.gte': 300 },
  },

  // Industry
  {
    id: 'bollywood',
    label: 'Bollywood',
    hindi: 'बॉलीवुड',
    group: 'industry',
    blurb: 'The biggest Hindi releases, handpicked',
    movie: {
      with_original_language: 'hi',
      with_origin_country: 'IN',
      ...hot(20),
    },
  },
  {
    id: 'indian-series',
    label: 'Indian Web Series',
    hindi: 'भारतीय वेब सीरीज़',
    group: 'industry',
    blurb: 'Binge-worthy series from India',
    tv: {
      with_origin_country: 'IN',
      ...hot(5),
    },
  },
  {
    id: 'south-indian',
    label: 'South Indian Cinema',
    hindi: 'साउथ सिनेमा',
    group: 'industry',
    blurb: 'Tamil, Telugu, Malayalam and Kannada hits',
    movie: {
      with_original_language: 'ta|te|ml|kn',
      with_origin_country: 'IN',
      ...hot(20),
    },
  },
  {
    id: 'hollywood',
    label: 'Hollywood',
    hindi: 'हॉलीवुड',
    group: 'industry',
    blurb: 'Big-screen English-language favourites',
    movie: {
      with_original_language: 'en',
      ...hot(150),
    },
  },
  {
    id: 'hollywood-series',
    label: 'Hollywood Series',
    hindi: 'हॉलीवुड सीरीज़',
    group: 'industry',
    blurb: 'Prestige and binge-worthy US series',
    tv: {
      with_original_language: 'en',
      ...hot(50),
    },
  },
  {
    id: 'kdrama',
    label: 'K-Dramas',
    hindi: 'के-ड्रामा',
    group: 'industry',
    blurb: 'Romance, revenge and everything Korean',
    tv: {
      with_original_language: 'ko',
      with_origin_country: 'KR',
      ...hot(10),
    },
  },
  {
    id: 'anime',
    label: 'Anime',
    hindi: 'एनीमे',
    group: 'industry',
    blurb: "Japan's best animated movies and series",
    movie: {
      with_genres: 16,
      with_original_language: 'ja',
      ...hot(30),
    },
    tv: {
      with_genres: 16,
      with_original_language: 'ja',
      ...hot(20),
    },
  },

  // Genres
  {
    id: 'action',
    label: 'Action',
    hindi: 'एक्शन',
    group: 'genres',
    movie: { with_genres: 28, ...hot(120) },
    tv: { with_genres: 10759, ...hot(30) },
  },
  {
    id: 'adventure',
    label: 'Adventure',
    hindi: 'एडवेंचर',
    group: 'genres',
    movie: { with_genres: 12, ...hot(120) },
    tv: { with_genres: 10759, ...hot(30) },
  },
  {
    id: 'comedy',
    label: 'Comedy',
    hindi: 'कॉमेडी',
    group: 'genres',
    movie: { with_genres: 35, ...hot(150) },
    tv: { with_genres: 35, ...hot(50) },
  },
  {
    id: 'drama',
    label: 'Drama',
    hindi: 'ड्रामा',
    group: 'genres',
    movie: { with_genres: 18, ...hot(200) },
    tv: { with_genres: 18, ...hot(80) },
  },
  {
    id: 'romance',
    label: 'Romance',
    hindi: 'रोमांस',
    group: 'genres',
    movie: { with_genres: 10749, ...hot(120) },
  },
  {
    id: 'thriller',
    label: 'Thriller',
    hindi: 'थ्रिलर',
    group: 'genres',
    movie: { with_genres: 53, ...hot(150) },
    tv: { with_genres: 9648, ...hot(50) },
  },
  {
    id: 'mystery',
    label: 'Mystery',
    hindi: 'मिस्ट्री',
    group: 'genres',
    movie: { with_genres: 9648, ...hot(100) },
    tv: { with_genres: 9648, ...hot(40) },
  },
  {
    id: 'horror',
    label: 'Horror',
    hindi: 'हॉरर',
    group: 'genres',
    movie: { with_genres: 27, ...hot(100) },
  },
  {
    id: 'scifi',
    label: 'Sci-Fi',
    hindi: 'साइ-फाई',
    group: 'genres',
    movie: { with_genres: 878, ...hot(150) },
    tv: { with_genres: 10765, ...hot(40) },
  },
  {
    id: 'fantasy',
    label: 'Fantasy',
    hindi: 'फैंटेसी',
    group: 'genres',
    movie: { with_genres: 14, ...hot(120) },
    tv: { with_genres: 10765, ...hot(40) },
  },
  {
    id: 'crime',
    label: 'Crime',
    hindi: 'क्राइम',
    group: 'genres',
    movie: { with_genres: 80, ...hot(120) },
    tv: { with_genres: 80, ...hot(40) },
  },
  {
    id: 'animation',
    label: 'Animation',
    hindi: 'एनिमेशन',
    group: 'genres',
    movie: { with_genres: 16, ...hot(100) },
    tv: { with_genres: 16, ...hot(30) },
  },
  {
    id: 'documentary',
    label: 'Documentary',
    hindi: 'डॉक्यूमेंट्री',
    group: 'genres',
    movie: { with_genres: 99, ...hot(50) },
    tv: { with_genres: 99, ...hot(20) },
  },
  {
    id: 'family',
    label: 'Family',
    hindi: 'फैमिली',
    group: 'genres',
    movie: { with_genres: 10751, ...hot(100) },
    tv: { with_genres: 10751, ...hot(20) },
  },
  {
    id: 'history',
    label: 'History',
    hindi: 'इतिहास',
    group: 'genres',
    movie: { with_genres: 36, ...hot(80) },
  },
  {
    id: 'war',
    label: 'War',
    hindi: 'युद्ध',
    group: 'genres',
    movie: { with_genres: 10752, ...hot(60) },
    tv: { with_genres: 10768, ...hot(20) },
  },
  {
    id: 'western',
    label: 'Western',
    hindi: 'वेस्टर्न',
    group: 'genres',
    movie: { with_genres: 37, ...hot(60) },
    tv: { with_genres: 37, ...hot(10) },
  },
  {
    id: 'reality',
    label: 'Reality',
    hindi: 'रियलिटी',
    group: 'genres',
    tv: { with_genres: 10764, ...hot(20) },
  },
]

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((category) => [category.id, category])
) as Record<string, CategoryDef>

export const DEFAULT_CATEGORY = 'trending'

export type CategoryMedia = 'movie' | 'tv' | 'all'

export const supportsCategory = (category: CategoryDef, media: CategoryMedia) => {
  if (media === 'all') return Boolean(category.movie || category.tv)
  return Boolean(category[media])
}

export const categoryGroups: { id: CategoryGroup; label: string }[] = [
  { id: 'spotlight', label: 'Spotlight' },
  { id: 'industry', label: 'Industry' },
  { id: 'genres', label: 'Genres' },
]

export const categoryForMedia = (id: string | null | undefined) =>
  (id && CATEGORY_MAP[id]) || CATEGORY_MAP[DEFAULT_CATEGORY]
