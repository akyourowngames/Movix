'use client'

import { useState, useEffect, useMemo, useRef, Suspense } from 'react'
import Link from 'next/link'
import { Search, Star, Filter, X, Film, Tv, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { getImageUrl, type CatalogItem } from '@/lib/catalog'
import { MediaSkeleton } from '@/components/ui/MediaSkeleton'
import { useLanguage } from '@/components/LanguageProvider'

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
    <MediaSkeleton count={8} label="Loading search results" className="lg:grid-cols-4 xl:grid-cols-5" />
  )
}

function SearchPageContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const { language } = useLanguage()
  const l = (en: string, hi: string) => (language === 'hi' ? hi : en)

  const [query, setQuery] = useState(initialQuery)
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedGenres, setSelectedGenres] = useState<number[]>([])
  const [minRating, setMinRating] = useState(0)
  const [yearRange, setYearRange] = useState([1980, new Date().getFullYear()])
  const [contentType, setContentType] = useState<'movie' | 'tv' | 'both'>('both')
  const filterTriggerRef = useRef<HTMLButtonElement>(null)
  const filterDialogRef = useRef<HTMLElement>(null)
  const restoreFilterFocus = useRef(false)
  const prefersReducedMotion = useReducedMotion()
  const activeFilterCount =
    selectedGenres.length +
    Number(minRating > 0) +
    Number(yearRange[0] !== 1980 || yearRange[1] !== new Date().getFullYear())

  useEffect(() => {
    if (!showFilters) {
      if (restoreFilterFocus.current) {
        filterTriggerRef.current?.focus()
        restoreFilterFocus.current = false
      }
      return
    }

    const previousOverflow = document.body.style.overflow
    restoreFilterFocus.current = true
    filterDialogRef.current
      ?.querySelector<HTMLElement>('button:not([disabled]), input:not([disabled])')
      ?.focus()

    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [showFilters])

  const handleFilterDialogKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      setShowFilters(false)
      return
    }

    if (event.key !== 'Tab' || !filterDialogRef.current) return
    const focusable = Array.from(
      filterDialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => element.offsetParent !== null)
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

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
      if (!Number.isFinite(year)) return true
      return year >= minYear && year <= maxYear
    })
  }, [items, selectedGenres, minRating, yearRange])

  const toggleGenre = (id: number) => {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    )
  }

  const filterControls = (
    <>
      <fieldset className="mb-7">
        <legend className="mb-3 font-medium">{l('Content type', 'कंटेंट टाइप')}</legend>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: 'both', en: 'Both', hi: 'दोनों' },
            { value: 'movie', en: 'Movies', hi: 'फिल्में' },
            { value: 'tv', en: 'TV', hi: 'टीवी' },
          ] as const).map((option) => (
            <button key={option.value} type="button" aria-pressed={contentType === option.value}
              onClick={() => setContentType(option.value)}
              className={`min-h-11 rounded-lg border px-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${contentType === option.value ? 'border-primary bg-primary text-black' : 'border-white/10 bg-white/5 text-white hover:bg-white/10'}`}>
              {l(option.en, option.hi)}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mb-7">
        <legend className="mb-3 font-medium">{l('Genres', 'शैलियाँ')}</legend>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          {GENRES.map((genre) => (
            <label key={genre.id} className="flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm text-white/80">
              <input type="checkbox" checked={selectedGenres.includes(genre.id)} onChange={() => toggleGenre(genre.id)}
                className="h-5 w-5 shrink-0 accent-[hsl(var(--primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
              <span>{l(genre.name, genre.hindi)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mb-7">
        <label htmlFor="min-rating" className="mb-3 flex items-center justify-between font-medium">
          <span>{l('Minimum rating', 'न्यूनतम रेटिंग')}</span><span className="text-primary tabular-nums">{minRating.toFixed(1)}</span>
        </label>
        <input id="min-rating" type="range" min="0" max="10" step="0.5" value={minRating}
          onChange={(event) => setMinRating(Number(event.target.value))}
          className="min-h-11 w-full accent-[hsl(var(--primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
        <div className="flex justify-between text-xs text-muted-foreground"><span>{l('Any rating', 'कोई भी रेटिंग')}</span><span>10</span></div>
      </div>

      <fieldset>
        <legend className="mb-3 font-medium">{l('Release year', 'रिलीज़ वर्ष')}</legend>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <label className="min-w-0">
            <span className="mb-1 block text-xs text-muted-foreground">{l('From', 'से')}</span>
            <input type="number" min="1900" max={new Date().getFullYear()} inputMode="numeric" aria-label={l('From year', 'से वर्ष')}
              value={yearRange[0]} onChange={(event) => setYearRange([Number(event.target.value), yearRange[1]])}
              className="h-11 w-full min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/40" />
          </label>
          <span className="mt-5 text-muted-foreground">{l('to', 'तक')}</span>
          <label className="min-w-0">
            <span className="mb-1 block text-xs text-muted-foreground">{l('To', 'तक')}</span>
            <input type="number" min="1900" max={new Date().getFullYear()} inputMode="numeric" aria-label={l('To year', 'तक वर्ष')}
              value={yearRange[1]} onChange={(event) => setYearRange([yearRange[0], Number(event.target.value)])}
              className="h-11 w-full min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/40" />
          </label>
        </div>
      </fieldset>
    </>
  )

  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <div className="page-shell max-w-screen-2xl">
        {/* Search Bar */}
        <div className="mx-auto mb-8 max-w-3xl sm:mb-12">
          <h1 className="mb-5 text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {l('Discover your next favourite', 'अपनी अगली पसंदीदा कहानी खोजें')}
          </h1>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              aria-label={l('Search movies and TV shows', 'फिल्में और टीवी शो खोजें')}
              maxLength={100}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={l('Search movies & shows...', 'फिल्में और शो खोजें...')}
              className="min-h-14 w-full border border-white/15 bg-card py-4 pl-12 pr-4 text-white placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(15rem,18rem)_minmax(0,1fr)] lg:gap-8">
          {/* Desktop filter rail */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 border border-white/10 bg-card p-5">
              <h2 className="mb-6 font-display text-xl font-bold">{l('Filters', 'फ़िल्टर')}</h2>
              {filterControls}

            </div>
          </aside>

          {/* Results Grid */}
          <div className="min-w-0">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
                {loading
                  ? l('Updating results…', 'परिणाम अपडेट हो रहे हैं…')
                  : query.trim().length >= 2
                    ? l(`${results.length} results`, `${results.length} परिणाम`)
                    : l('Search to discover something to watch', 'देखने के लिए कुछ खोजें')}
              </p>
              <button
                ref={filterTriggerRef}
                type="button"
                onClick={() => setShowFilters(true)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 lg:hidden"
                aria-haspopup="dialog"
                aria-expanded={showFilters}
              >
                <Filter className="h-4 w-4" />
                {l('Filters', 'फ़िल्टर')}{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </button>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => { setSelectedGenres([]); setMinRating(0); setYearRange([1980, new Date().getFullYear()]) }}
                  className="min-h-11 rounded-xl px-3 text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                >
                  {l('Clear filters', 'फ़िल्टर साफ़ करें')}
                </button>
              )}
            </div>

            {error ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
                <p>{l('Search failed. Please retry.', 'खोज विफल रही। फिर कोशिश करें।')}</p>
                <button
                  type="button"
                  onClick={() => setReloadKey((k) => k + 1)}
                  className="flex min-h-11 items-center gap-2 rounded-lg bg-white/10 px-4 py-2 transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
                >
                  <RefreshCw className="w-4 h-4" />
                  {l('Retry', 'फिर कोशिश करें')}
                </button>
              </div>
            ) : loading && items.length === 0 ? (
              <SearchSkeleton />
            ) : results.length > 0 ? (
              <div
                className={`grid min-w-0 grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 xl:grid-cols-4 transition-opacity duration-300 motion-reduce:transition-none ${
                  loading ? 'opacity-75' : 'opacity-100'
                }`}
              >
                {results.map((item) => {
                  const isTV = item.media_type === 'tv'
                  const href = isTV ? `/tv/${item.id}` : `/movie/${item.id}`

                  return (
                    <Link key={`${item.media_type}-${item.id}`} href={href} className="group min-w-0 cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                      <div className="relative mb-3 aspect-[2/3] overflow-hidden rounded-xl bg-white/5">
                        {item.poster_path ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={getImageUrl(item.poster_path, 'w342')}
                            alt={`${item.title} poster`}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            {isTV ? <Tv className="h-8 w-8" aria-hidden="true" /> : <Film className="h-8 w-8" aria-hidden="true" />}
                            <span className="sr-only">{l('Poster unavailable', 'पोस्टर उपलब्ध नहीं')}</span>
                          </div>
                        )}
                        <div className="absolute top-2 left-2 bg-black/80 backdrop-blur px-2 py-1 rounded-lg">
                          {isTV ? <Tv className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                        </div>
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/80 backdrop-blur px-2 py-1 rounded-lg">
                          <Star className="w-3 h-3 fill-primary text-primary" />
                          <span className="text-xs font-bold">{Number.isFinite(item.vote_average) ? item.vote_average.toFixed(1) : '—'}</span>
                        </div>
                      </div>
                      <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.release_date && Number.isFinite(new Date(item.release_date).getTime())
                          ? new Date(item.release_date).getFullYear()
                          : l('Release date unavailable', 'रिलीज़ डेट उपलब्ध नहीं')}
                      </p>
                    </Link>
                  )
                })}
              </div>
            ) : query.trim().length >= 2 ? (
              <div className="text-center py-20 text-muted-foreground" role="status">
                {l('No movies found. Try different keywords or filters.', 'कोई फिल्म नहीं मिली। दूसरे शब्द या फ़िल्टर आज़माएँ।')}
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground" role="status">
                {l('Start typing to search movies...', 'फिल्में खोजने के लिए टाइप करें...')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filters: modal bottom sheet with a scrollable body and sticky actions. */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.button
              type="button"
              aria-label="Close filters"
              onClick={() => setShowFilters(false)}
              className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            />
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-filter-title"
              ref={filterDialogRef}
              onKeyDown={handleFilterDialogKeyDown}
              className="fixed inset-x-0 bottom-0 z-[61] flex max-h-[85dvh] flex-col rounded-t-3xl border border-white/10 bg-zinc-950 shadow-2xl [padding-bottom:env(safe-area-inset-bottom)] lg:hidden"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: [0.2, 0, 0, 1] }}
            >
              <div className="flex justify-center pt-3" aria-hidden="true">
                <span className="h-1 w-10 rounded-full bg-white/25" />
              </div>
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <h2 id="mobile-filter-title" className="font-display text-xl font-bold">{l('Filters', 'फ़िल्टर')}</h2>
                <button type="button" onClick={() => setShowFilters(false)} className="flex h-11 w-11 items-center justify-center rounded-full text-white/70 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={l('Close filters', 'फ़िल्टर बंद करें')}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
                {filterControls}
              </div>
              <div className="flex gap-3 border-t border-white/10 bg-zinc-950 px-5 py-4">
                <button type="button" onClick={() => { setSelectedGenres([]); setMinRating(0); setYearRange([1980, new Date().getFullYear()]) }} className="min-h-12 flex-1 rounded-xl border border-white/15 px-4 text-sm font-medium text-white hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  {l('Reset', 'रीसेट')}
                </button>
                <button type="button" onClick={() => setShowFilters(false)} className="min-h-12 flex-[2] rounded-xl bg-primary px-4 text-sm font-semibold text-black transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950">
                  {l(`Show ${results.length} results`, `${results.length} परिणाम दिखाएँ`)}
                </button>
              </div>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </main>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background pt-24 pb-32">
        <div className="page-shell">
          <SearchSkeleton />
        </div>
      </main>
    }>
      <SearchPageContent />
    </Suspense>
  )
}
