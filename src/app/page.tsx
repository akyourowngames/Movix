import HeroSection from '@/components/HeroSection'
import MovieCarousel from '@/components/MovieCarousel'
import { getTrendingHindi, getNewReleases, getTrendingWebSeries, getImageUrl, type TMDBMovie } from '@/lib/tmdb'
import type { Movie } from '@/lib/data'

async function transformTMDBToMovie(tmdbMovies: TMDBMovie[], type: 'movie' | 'tv' = 'movie'): Promise<Movie[]> {
  return tmdbMovies.map((item) => ({
    id: item.id.toString(),
    title: type === 'tv' ? item.name : item.title,
    hindiTitle: type === 'tv' 
      ? (item.original_name !== item.name ? item.original_name : undefined)
      : (item.original_title !== item.title ? item.original_title : undefined),
    poster: getImageUrl(item.poster_path),
    backdrop: getImageUrl(item.backdrop_path, 'original'),
    genre: [],
    year: new Date(type === 'tv' ? item.first_air_date : item.release_date).getFullYear(),
    duration: type === 'tv' ? 'Series' : '2h 30m',
    rating: item.vote_average,
    quality: item.vote_average >= 7 ? '4K' : 'HD',
    description: item.overview,
  }))
}

export default async function Home() {
  const [trendingData, newReleasesData, popularData, webSeriesData] = await Promise.all([
    getTrendingHindi(1),
    getNewReleases(1),
    getTrendingHindi(2),
    getTrendingWebSeries(1),
  ])

  const trending = await transformTMDBToMovie(trendingData.results?.slice(0, 15) || [])
  const newReleases = await transformTMDBToMovie(newReleasesData.results?.slice(0, 15) || [])
  const popular = await transformTMDBToMovie(popularData.results?.slice(0, 15) || [])
  const webSeries = await transformTMDBToMovie(webSeriesData.results?.slice(0, 15) || [], 'tv')

  return (
    <main className="min-h-screen bg-background pb-32">
      <HeroSection />

      <div className="relative z-30 -mt-32 pt-16">
        <MovieCarousel
          title="Trending Now"
          hindiTitle="ट्रेंडिंग अभी"
          movies={trending}
        />

        <MovieCarousel
          title="Trending Web Series"
          hindiTitle="ट्रेंडिंग वेब सीरीज़"
          movies={webSeries}
          type="tv"
        />

        <MovieCarousel
          title="New Releases"
          hindiTitle="नई रिलीज़"
          movies={newReleases}
        />

        <MovieCarousel
          title="Popular"
          hindiTitle="लोकप्रिय"
          movies={popular}
        />
      </div>
    </main>
  )
}
