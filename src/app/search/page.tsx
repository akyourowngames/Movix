'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { Search, Star, Filter, X, Film, Tv, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { getImageUrl, type CatalogItem } from '@/lib/catalog'

const GENRES = [
  { id: 28, name: 'Action', hindi: 'एक्शन' },
  { id: 18, name: 'Drama', hindi: 'ड्रामा' },
  { id: 35, name: 'Comedy', hindi: 'कॉमेडी' },
  { id: 53, name: 'Thriller', hindi: 'थ्रिलर' },
  { id: 10749, name: 'Romance', hindi: 'रोमांस' },
  { id: 27, name: 'Horror', hindi: 'हॉरर' },
]

const CACHE_TTL = 5 * 60 * 1000
const cache = new Map<string, { items: CatalogItem[]; ts: number }>()

function SearchSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[2/3] rounded-xl bg-white/5 mb-3" />
          <div className="h-4 bg-white/5 rounded w-3/4 mb-2" />
          <div className="h-3 bg-white/5 rounded w-1/3" />
        </div>
      ))}
    </div>
  )
}

function SearchPageContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [query, setQuery] = useState(initialQuery)
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [showFilters, setShowFilters] = useState(true)
  const [selectedGenres, setSelectedGenres] = useState<number[]>([])
  const [minRating, setMinRating] = useState(0)
  const [yearRange, setYearRange] = useState([1980, new Date().getFullYear()])
  const [contentType, setContentType] = useState<'movie' | 'tv' | 'both'>('both')

  // Keep the input in sync when navigating here with ?q= from the navbar
  useEffect(() => {
    if (initialQuery) setQuery(initialQuery)
  }, [initialQuery])

  useEffect(() => {
    const q = query.trim()

    if (q.length < 2) {
      setItems([])
      setLoading(false)
      setError(false)
      return
    }

    const key = `${contentType}:${q.toLowerCase()}`
    const cached = cache.get(key)
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setItems(cached.items)
      setLoading(false)
      setError(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(false)

    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}&type=${contentType}`, {
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.json()
        })
        .then((data) => {
          const results: CatalogItem[] = data.results || []
          cache.set(key, { items: results, ts: Date.now() })
          setItems(results)
          setLoading(false)
        })
        .catch((err) => {
          if ((err as Error).name === 'AbortError') return
          setError(true)
          setLoading(false)
        })
    }, 350)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, contentType, reloadKey])

  // Filters run locally — changing them never re-triggers a network request
  const results = useMemo(() => {
    let filtered = items

    if (selectedGenres.length > 0) {
      filtered = filtered.filter((item) =>
        item.genre_ids.some((g) => selectedGenres.includes(g))
      )
    }
    if (minRating > 0) {
      filtered = filtered.filter((item) => item.vote_average >= minRating)
    }

    const [minYear, maxYear] = yearRange
    return filtered.filter((item) => {
      if (!item.release_date) return true
      const year = new Date(item.release_date).getFullYear()
      return year >= minYear && year <= maxYear
    })
  }, [items, selectedGenres, minRating, yearRange])

  const toggleGenre = (id: number) => {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
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

            {error ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4 text-white/60">
                <p>Search failed. Please retry.</p>
                <button
                  onClick={() => setReloadKey((k) => k + 1)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            ) : loading && items.length === 0 ? (
              <SearchSkeleton />
            ) : results.length > 0 ? (
              <div
                className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 transition-opacity duration-300 ${
                  loading ? 'opacity-50' : 'opacity-100'
                }`}
              >
                {results.map((item) => {
                  const isTV = item.media_type === 'tv'
                  const href = isTV ? `/tv/${item.id}` : `/movie/${item.id}`

                  return (
                    <Link key={`${item.media_type}-${item.id}`} href={href} className="group cursor-pointer">
                      <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 bg-white/5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getImageUrl(item.poster_path, 'w342')}
                          alt={item.title}
                          loading="lazy"
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
                        {item.title}
                      </h3>
                      <p className="text-xs text-white/60 mt-1">
                        {item.release_date ? new Date(item.release_date).getFullYear() : 'N/A'}
                      </p>
                    </Link>
                  )
                })}
              </div>
            ) : query.trim().length >= 2 ? (
              <div className="text-center py-20 text-white/60">
                No movies found. Try different keywords or filters.
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

export default function SearchPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background pt-24 pb-32">
        <div className="container mx-auto px-6">
          <SearchSkeleton />
        </div>
      </main>
    }>
      <SearchPageContent />
    </Suspense>
  )
}
