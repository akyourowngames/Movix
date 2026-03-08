'use client'

import { useState, useEffect } from 'react'
import { getTrendingHindi, getNewReleases, getTrendingWebSeries, getPopularShows, getImageUrl, type TMDBMovie } from '@/lib/tmdb'
import Link from 'next/link'
import { Star, ChevronLeft, ChevronRight, Film, Tv } from 'lucide-react'
import { motion } from 'framer-motion'

export default function BrowsePage() {
  const [movies, setMovies] = useState<TMDBMovie[]>([])
  const [loading, setLoading] = useState(true)
  const [contentType, setContentType] = useState<'movie' | 'tv'>('movie')
  const [filter, setFilter] = useState<'trending' | 'new'>('trending')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true)
      let data
      
      if (contentType === 'movie') {
        data = filter === 'trending' 
          ? await getTrendingHindi(page) 
          : await getNewReleases(page)
      } else {
        data = filter === 'trending'
          ? await getTrendingWebSeries(page)
          : await getPopularShows(page)
      }
      
      setMovies(data.results || [])
      setTotalPages(Math.min(data.total_pages || 1, 20)) // Limit to 20 pages
      setLoading(false)
    }
    fetchMovies()
  }, [contentType, filter, page])

  const handleContentTypeChange = (type: 'movie' | 'tv') => {
    setContentType(type)
    setPage(1)
  }

  const handleFilterChange = (newFilter: 'trending' | 'new') => {
    setFilter(newFilter)
    setPage(1)
  }

  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <div className="container mx-auto px-6">
        <h1 className="font-display text-4xl font-bold mb-8">
          Browse {contentType === 'movie' ? 'Movies' : 'Web Series'}
        </h1>

        {/* Content Type Tabs */}
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => handleContentTypeChange('movie')}
            className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              contentType === 'movie'
                ? 'bg-primary text-background'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Film className="w-4 h-4" />
            Movies
          </button>
          <button
            onClick={() => handleContentTypeChange('tv')}
            className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              contentType === 'tv'
                ? 'bg-primary text-background'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Tv className="w-4 h-4" />
            Web Series
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => handleFilterChange('trending')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              filter === 'trending'
                ? 'bg-primary text-background'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Trending
          </button>
          <button
            onClick={() => handleFilterChange('new')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              filter === 'new'
                ? 'bg-primary text-background'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            New Releases
          </button>
        </div>

        {/* Movies Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-8">
              {movies.map((item: any, index) => {
                const isTV = contentType === 'tv'
                const title = isTV ? item.name : item.title
                const date = isTV ? item.first_air_date : item.release_date
                const href = isTV ? `/tv/${item.id}` : `/movie/${item.id}`
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={href}>
                      <div className="group cursor-pointer">
                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3">
                          <img
                            src={getImageUrl(item.poster_path)}
                            alt={title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/80 px-2 py-1 rounded">
                            <Star className="w-3 h-3 fill-primary text-primary" />
                            <span className="text-xs font-bold">{item.vote_average.toFixed(1)}</span>
                          </div>
                        </div>
                        <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                          {title}
                        </h3>
                        <p className="text-xs text-white/60 mt-1">
                          {new Date(date).getFullYear()}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-white/60">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
