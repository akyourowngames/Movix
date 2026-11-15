'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, ChevronLeft, ChevronRight, Film, Tv, RefreshCw } from 'lucide-react'
import { getImageUrl, type CatalogItem } from '@/lib/catalog'

interface CacheEntry {
  items: CatalogItem[]
  totalPages: number
  ts: number
}

const CACHE_TTL = 5 * 60 * 1000
const cache = new Map<string, CacheEntry>()

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-8">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[2/3] rounded-xl bg-white/5 mb-3" />
          <div className="h-4 bg-white/5 rounded w-3/4 mb-2" />
          <div className="h-3 bg-white/5 rounded w-1/3" />
        </div>
      ))}
    </div>
  )
}

export default function BrowsePage() {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [contentType, setContentType] = useState<'movie' | 'tv'>('movie')
  const [filter, setFilter] = useState<'trending' | 'new'>('trending')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const key = `${contentType}:${filter}:${page}`
    const cached = cache.get(key)

    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setItems(cached.items)
      setTotalPages(cached.totalPages)
      setLoading(false)
      setError(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(false)

    fetch(`/api/catalog?type=${contentType}&filter=${filter}&page=${page}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        const results: CatalogItem[] = data.results || []
        const pages = data.totalPages || 1
        cache.set(key, { items: results, totalPages: pages, ts: Date.now() })
        setItems(results)
        setTotalPages(pages)
        setLoading(false)
      })
      .catch((err) => {
        if ((err as Error).name === 'AbortError') return
        setError(true)
        setLoading(false)
      })

    return () => controller.abort()
  }, [contentType, filter, page, reloadKey])

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
        {error ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-white/60">
            <p>Couldn&apos;t load titles. Please retry.</p>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        ) : loading && items.length === 0 ? (
          <GridSkeleton />
        ) : (
          <>
            <div
              className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-8 transition-opacity duration-300 ${
                loading ? 'opacity-50 pointer-events-none' : 'opacity-100'
              }`}
            >
              {items.map((item) => {
                const href = contentType === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`

                return (
                  <Link key={item.id} href={href} className="group cursor-pointer">
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 bg-white/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImageUrl(item.poster_path, 'w342')}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/80 px-2 py-1 rounded">
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

            {/* Pagination */}
            <div className="flex justify-center items-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="px-4 py-2 bg-white/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-white/60">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
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
