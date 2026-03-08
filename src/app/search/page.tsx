'use client'

import { useState, useEffect } from 'react'
import { searchMovies, searchWebSeries, getImageUrl, type TMDBMovie } from '@/lib/tmdb'
import Link from 'next/link'
import { Search, Star, Filter, X, Film, Tv } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'

const GENRES = [
  { id: 28, name: 'Action', hindi: 'एक्शन' },
  { id: 18, name: 'Drama', hindi: 'ड्रामा' },
  { id: 35, name: 'Comedy', hindi: 'कॉमेडी' },
  { id: 53, name: 'Thriller', hindi: 'थ्रिलर' },
  { id: 10749, name: 'Romance', hindi: 'रोमांस' },
  { id: 27, name: 'Horror', hindi: 'हॉरर' },
]

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  
  const [query, setQuery] = useState(initialQuery)
  const [movies, setMovies] = useState<TMDBMovie[]>([])
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(true)
  const [selectedGenres, setSelectedGenres] = useState<number[]>([])
  const [minRating, setMinRating] = useState(0)
  const [yearRange, setYearRange] = useState([1980, 2024])
  const [contentType, setContentType] = useState<'movie' | 'tv' | 'both'>('both')

  interface SearchResult extends TMDBMovie {
    media_type: 'movie' | 'tv'
  }

  useEffect(() => {
    if (initialQuery) {
      handleSearch()
    }
  }, [initialQuery])

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (query.length > 2) {
        handleSearch()
      } else if (query.length === 0) {
        setMovies([])
      }
    }, 500)
    return () => clearTimeout(delaySearch)
  }, [query, selectedGenres, minRating, yearRange, contentType])

  const handleSearch = async () => {
    if (!query.trim()) return
    
    setLoading(true)
    
    let results: SearchResult[] = []
    
    if (contentType === 'both') {
      const [movieData, tvData] = await Promise.all([
        searchMovies(query),
        searchWebSeries(query)
      ])
      results = [
        ...(movieData.results || []).map((m: TMDBMovie) => ({ ...m, media_type: 'movie' as const })),
        ...(tvData.results || []).map((t: TMDBMovie) => ({ ...t, media_type: 'tv' as const }))
      ]
    } else if (contentType === 'movie') {
      const data = await searchMovies(query)
      results = (data.results || []).map((m: TMDBMovie) => ({ ...m, media_type: 'movie' as const }))
    } else {
      const data = await searchWebSeries(query)
      results = (data.results || []).map((t: TMDBMovie) => ({ ...t, media_type: 'tv' as const }))
    }
    
    // Apply filters
    if (selectedGenres.length > 0) {
      results = results.filter((m: SearchResult) => 
        m.genre_ids?.some((g: number) => selectedGenres.includes(g))
      )
    }
    if (minRating > 0) {
      results = results.filter((m: SearchResult) => m.vote_average >= minRating)
    }
    const [minYear, maxYear] = yearRange
    results = results.filter((m: SearchResult) => {
      const dateField = m.media_type === 'tv' ? m.first_air_date : m.release_date
      const year = new Date(dateField).getFullYear()
      return year >= minYear && year <= maxYear
    })
    
    setMovies(results)
    setLoading(false)
  }

  const toggleGenre = (id: number) => {
    setSelectedGenres(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    )
  }

  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <div className="container mx-auto px-6">
        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies... (खोजें फिल्में...)"
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 backdrop-blur-xl"
            />
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <AnimatePresence>
            {showFilters && (
              <motion.aside
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                className="w-72 flex-shrink-0"
              >
                <div className="sticky top-24 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display text-xl font-bold">Filters</h3>
                    <button onClick={() => setShowFilters(false)}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Content Type Filter */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Content Type</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setContentType('both')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                          contentType === 'both' ? 'bg-primary text-black' : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        Both
                      </button>
                      <button
                        onClick={() => setContentType('movie')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition-all ${
                          contentType === 'movie' ? 'bg-primary text-black' : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <Film className="w-4 h-4" />
                        Movies
                      </button>
                      <button
                        onClick={() => setContentType('tv')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition-all ${
                          contentType === 'tv' ? 'bg-primary text-black' : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <Tv className="w-4 h-4" />
                        TV
                      </button>
                    </div>
                  </div>

                  {/* Genre Filter */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Genre / शैली</h4>
                    <div className="space-y-2">
                      {GENRES.map(genre => (
                        <label key={genre.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedGenres.includes(genre.id)}
                            onChange={() => toggleGenre(genre.id)}
                            className="w-4 h-4 rounded border-white/20 bg-white/5 checked:bg-primary"
                          />
                          <span className="text-sm">{genre.name} / {genre.hindi}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Min Rating</h4>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={minRating}
                      onChange={(e) => setMinRating(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-sm text-white/60 mt-1">
                      <span>0</span>
                      <span className="text-primary font-bold">{minRating}</span>
                      <span>10</span>
                    </div>
                  </div>

                  {/* Year Range */}
                  <div>
                    <h4 className="font-medium mb-3">Year Range</h4>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={yearRange[0]}
                        onChange={(e) => setYearRange([Number(e.target.value), yearRange[1]])}
                        className="w-20 px-2 py-1 bg-white/5 border border-white/10 rounded text-sm"
                      />
                      <span className="text-white/40">-</span>
                      <input
                        type="number"
                        value={yearRange[1]}
                        onChange={(e) => setYearRange([yearRange[0], Number(e.target.value)])}
                        className="w-20 px-2 py-1 bg-white/5 border border-white/10 rounded text-sm"
                      />
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Results Grid */}
          <div className="flex-1">
            {!showFilters && (
              <button
                onClick={() => setShowFilters(true)}
                className="mb-6 px-4 py-2 bg-white/10 rounded-lg flex items-center gap-2 hover:bg-white/20 transition-all"
              >
                <Filter className="w-4 h-4" />
                Show Filters
              </button>
            )}

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : movies.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {movies.map((item: SearchResult, index) => {
                  const isTV = item.media_type === 'tv'
                  const title = isTV ? item.name : item.title
                  const date = isTV ? item.first_air_date : item.release_date
                  const href = isTV ? `/tv/${item.id}` : `/movie/${item.id}`
                  
                  return (
                    <motion.div
                      key={`${item.media_type}-${item.id}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link href={href}>
                        <div className="group cursor-pointer">
                          <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 bg-white/5">
                            <img
                              src={getImageUrl(item.poster_path)}
                              alt={title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute top-2 left-2 bg-black/80 backdrop-blur px-2 py-1 rounded-lg">
                              {isTV ? <Tv className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                            </div>
                            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/80 backdrop-blur px-2 py-1 rounded-lg">
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
            ) : query.length > 2 ? (
              <div className="text-center py-20 text-white/60">
                No movies found. Try different keywords.
              </div>
            ) : (
              <div className="text-center py-20 text-white/60">
                Start typing to search movies...
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
