'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Film,
  Globe2,
  LayoutGrid,
  Play,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tv,
} from 'lucide-react'
import { getImageUrl, type CatalogItem } from '@/lib/catalog'
import { genreNamesFor } from '@/lib/genres'
import { MediaSkeleton } from '@/components/ui/MediaSkeleton'
import { useLanguage, type Language } from '@/components/LanguageProvider'
import {
  CATEGORIES,
  CATEGORY_MAP,
  browsePathFor,
  categoryGroups,
  supportsCategory,
  type CategoryDef,
  type CategoryMedia,
} from '@/lib/categories'

interface CacheEntry {
  items: CatalogItem[]
  totalPages: number
  totalResults: number
  ts: number
}

const CACHE_TTL = 5 * 60 * 1000
const cache = new Map<string, CacheEntry>()

const LANGUAGE_BADGES: Record<string, string> = {
  hi: 'HI',
  en: 'EN',
  ko: 'KO',
  ja: 'JA',
  ta: 'TA',
  te: 'TE',
  ml: 'ML',
  kn: 'KN',
}

const MEDIA_LABEL: Record<CategoryMedia, { en: string; hi: string }> = {
  all: { en: 'Movies & Series', hi: 'फिल्में और सीरीज़' },
  movie: { en: 'Movies', hi: 'फिल्में' },
  tv: { en: 'Web Series', hi: 'वेब सीरीज़' },
}

const GROUP_LABEL: Record<string, { en: string; hi: string }> = {
  spotlight: { en: 'Spotlight', hi: 'स्पॉटलाइट' },
  industry: { en: 'Industry', hi: 'इंडस्ट्री' },
  genres: { en: 'Genres', hi: 'शैलियाँ' },
}

const GROUP_ICON = {
  spotlight: Sparkles,
  industry: Globe2,
  genres: Clapperboard,
}

function GridSkeleton() {
  return (
    <MediaSkeleton count={15} label="Loading browse results" className="md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" />
  )
}

function CategoryNavButton({
  item,
  active,
  onClick,
  onPrefetch,
  language,
  compact = false,
}: {
  item: CategoryDef
  active: boolean
  onClick: () => void
  onPrefetch?: () => void
  language: Language
  compact?: boolean
}) {
  const label = language === 'hi' ? item.hindi : item.label

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={onPrefetch}
        onFocus={onPrefetch}
        aria-pressed={active}
        aria-current={active ? 'page' : undefined}
        className={`min-h-11 rounded-lg border px-3 py-2 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none ${
          active
            ? 'border-primary bg-primary text-black shadow-[0_0_14px_hsla(var(--primary)/0.35)]'
            : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/25 hover:bg-white/10 hover:text-white'
        }`}
      >
        {label}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onPrefetch}
      onFocus={onPrefetch}
      aria-pressed={active}
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none ${
        active
          ? 'bg-primary/15 font-medium text-primary'
          : 'text-white/65 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span className="truncate">{label}</span>
      {active ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> : null}
    </button>
  )
}

interface BrowseClientProps {
  initialType: CategoryMedia
  initialCategoryId: string
  initialPage: number
  initialItems: CatalogItem[]
  initialTotalPages: number
  initialTotalResults: number
  initialError?: boolean
}

export default function BrowseClient({
  initialType,
  initialCategoryId,
  initialPage,
  initialItems,
  initialTotalPages,
  initialTotalResults,
  initialError = false,
}: BrowseClientProps) {
  const [items, setItems] = useState<CatalogItem[]>(initialItems)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError)
  const [type, setType] = useState<CategoryMedia>(initialType)
  const [categoryId, setCategoryId] = useState(initialCategoryId)
  const [page, setPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [totalResults, setTotalResults] = useState(initialTotalResults)
  const [reloadKey, setReloadKey] = useState(0)
  const [genresOpen, setGenresOpen] = useState(false)
  const { language } = useLanguage()
  const l = (en: string, hi: string) => (language === 'hi' ? hi : en)
  const mediaLabel = MEDIA_LABEL[type][language]
  const initialKeyRef = useRef(`${initialType}:${initialCategoryId}:${initialPage}`)

  const category = CATEGORY_MAP[categoryId] ?? CATEGORY_MAP.trending

  // Keep the initial SSR payload available to the fetch cache.
  useEffect(() => {
    if (initialError) return

    cache.set(initialKeyRef.current, {
      items: initialItems,
      totalPages: initialTotalPages,
      totalResults: initialTotalResults,
      ts: Date.now(),
    })
  }, [initialError, initialItems, initialTotalPages, initialTotalResults])

  useEffect(() => {
    if (!supportsCategory(category, type)) {
      setCategoryId('trending')
      setPage(1)
    }
  }, [category, type])

  // Keep filter state shareable without a server navigation.
  useEffect(() => {
    const nextPath = browsePathFor(type, categoryId, page)
    const currentPath = `${window.location.pathname}${window.location.search}`
    if (currentPath !== nextPath) {
      window.history.replaceState(null, '', nextPath)
    }
  }, [type, categoryId, page])

  useEffect(() => {
    const key = `${type}:${categoryId}:${page}`
    const cached = cache.get(key)

    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setItems(cached.items)
      setTotalPages(cached.totalPages)
      setTotalResults(cached.totalResults)
      setLoading(false)
      setError(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(false)

    fetch(`/api/catalog?type=${type}&category=${categoryId}&page=${page}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        const results: CatalogItem[] = data.results || []
        const pages = Number(data.totalPages) || 1
        const total = Number(data.totalResults) || 0
        cache.set(key, { items: results, totalPages: pages, totalResults: total, ts: Date.now() })
        setItems(results)
        setTotalPages(pages)
        setTotalResults(total)
        setLoading(false)
      })
      .catch((err) => {
        if ((err as Error).name === 'AbortError') return
        setError(true)
        setLoading(false)
      })

    return () => controller.abort()
  }, [type, categoryId, page, reloadKey])

  const groups = useMemo(
    () =>
      categoryGroups
        .map((group) => ({
          ...group,
          categories: CATEGORIES.filter(
            (item) => item.group === group.id && supportsCategory(item, type)
          ),
        }))
        .filter((group) => group.categories.length > 0),
    [type]
  )

  const quickCategories = useMemo(() => {
    const base = groups
      .filter((group) => group.id !== 'genres')
      .flatMap((group) => group.categories)
    const active = CATEGORY_MAP[categoryId]
    const activeIsGenre = active?.group === 'genres'
    return activeIsGenre && !base.some((item) => item.id === active.id)
      ? [active, ...base]
      : base
  }, [groups, categoryId])

  const genreCategories = groups.find((group) => group.id === 'genres')?.categories ?? []

  const changeType = (next: CategoryMedia) => {
    setType(next)
    setPage(1)
    if (!supportsCategory(category, next)) setCategoryId('trending')
  }

  const changeCategory = (next: string) => {
    setCategoryId(next)
    setPage(1)
    setGenresOpen(false)
  }

  // Warm the cache while hovering category controls so switching feels instant.
  const prefetchCategory = (id: string) => {
    const target = CATEGORY_MAP[id]
    if (!target) return

    const targetType = supportsCategory(target, type) ? type : 'all'
    const key = `${targetType}:${id}:1`
    const cached = cache.get(key)
    if (cached && Date.now() - cached.ts < CACHE_TTL) return

    fetch(`/api/catalog?type=${targetType}&category=${id}&page=1`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return
        cache.set(key, {
          items: data.results || [],
          totalPages: Number(data.totalPages) || 1,
          totalResults: Number(data.totalResults) || 0,
          ts: Date.now(),
        })
      })
      .catch(() => {
        // Prefetch is best-effort.
      })
  }

  const blurb =
    language === 'hi'
      ? `${category.hindi} टाइटल्स देखें — रेटिंग, पोस्टर और स्ट्रीमिंग जानकारी के साथ।`
      : category.blurb ?? `Top ${category.label.toLowerCase()} picks across movies and series`
  const headingLabel = language === 'hi' ? category.hindi : category.label

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background pb-24 pt-24 sm:pt-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-primary/[0.07] via-transparent to-transparent" />

      <div className="page-shell relative">
        {/* Header */}
        <div className="mb-8 overflow-hidden border border-white/10 bg-card p-5 sm:p-7 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <nav className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                <Link href="/browse" className="transition-colors hover:text-white/70">
                  {l('Browse', 'ब्राउज़')}
                </Link>
                <span>/</span>
                <span className="text-primary">{mediaLabel}</span>
              </nav>
              <h1 className="font-display text-4xl font-bold md:text-5xl">{headingLabel}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span>{blurb}</span>
                {language === 'en' && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{category.hindi}</span>
                  </>
                )}
                {totalResults > 0 && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-white/70">
                      {totalResults.toLocaleString()}+ {l('titles', 'टाइटल्स')}
                    </span>
                  </>
                )}
              </p>
            </div>

            <div className="inline-flex w-full shrink-0 items-center gap-1 self-start rounded-full border border-white/10 bg-black/30 p-1 backdrop-blur md:w-auto md:self-auto">
              {(['all', 'movie', 'tv'] as const).map((option) => {
                const Icon = option === 'movie' ? Film : option === 'tv' ? Tv : LayoutGrid
                const label =
                  option === 'movie'
                    ? l('Movies', 'फिल्में')
                    : option === 'tv'
                      ? l('Series', 'सीरीज़')
                      : l('All', 'सभी')
                const desktopLabel =
                  option === 'tv' ? l('Web Series', 'वेब सीरीज़') : label
                const active = type === option
                return (
                  <button
                    key={option}
                    onClick={() => changeType(option)}
                    aria-pressed={active}
                    className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium transition-all sm:gap-2 sm:px-4 sm:text-sm md:flex-none ${
                      active
                        ? 'bg-primary text-black shadow-[0_0_18px_hsla(var(--primary)/0.35)]'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="sm:hidden">{label}</span>
                    <span className="hidden sm:inline">{desktopLabel}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Mobile filters */}
        <div className="mb-6 lg:hidden">
          <div className="flex items-center gap-2">
            <div
              className="relative min-w-0 flex-1"
              style={{
                maskImage:
                  'linear-gradient(to right, black 0%, black calc(100% - 2.5rem), transparent 100%)',
                WebkitMaskImage:
                  'linear-gradient(to right, black 0%, black calc(100% - 2.5rem), transparent 100%)',
              }}
            >
              <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-2 pr-10">
                {quickCategories.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => changeCategory(item.id)}
                    onMouseEnter={() => prefetchCategory(item.id)}
                    onFocus={() => prefetchCategory(item.id)}
                    className={`min-h-11 shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none ${
                      categoryId === item.id
                        ? 'border-primary bg-primary text-black'
                        : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {language === 'hi' ? item.hindi : item.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setGenresOpen((open) => !open)}
              aria-expanded={genresOpen}
              aria-controls="mobile-genre-filters"
              className={`mb-2 flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none ${
                genresOpen || category.group === 'genres'
                  ? 'border-primary/60 bg-primary/10 text-primary'
                  : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {l('Genres', 'शैलियाँ')}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${genresOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          {genresOpen && (
            <div id="mobile-genre-filters" className="mt-2 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              {genreCategories.map((item) => (
                <CategoryNavButton
                  key={item.id}
                  item={item}
                  active={categoryId === item.id}
                  onClick={() => changeCategory(item.id)}
                  onPrefetch={() => prefetchCategory(item.id)}
                  language={language}
                  compact
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden w-60 shrink-0 lg:block">
            <div className="relative">
              <div className="hide-scrollbar sticky top-24 max-h-[calc(100dvh-7.5rem)] overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur">
              {groups.map((group) => {
                const Icon = GROUP_ICON[group.id]
                return (
                  <div key={group.id} className="mb-4 last:mb-0">
                    <div className="mb-2 flex items-center gap-2 px-2">
                      <Icon className="h-3.5 w-3.5 text-primary/70" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        {GROUP_LABEL[group.id]?.[language] ?? group.label}
                      </p>
                    </div>
                    {group.id === 'genres' ? (
                      <div className="flex flex-wrap gap-1.5 px-1">
                        {group.categories.map((item) => (
                          <CategoryNavButton
                            key={item.id}
                            item={item}
                            active={categoryId === item.id}
                            onClick={() => changeCategory(item.id)}
                            onPrefetch={() => prefetchCategory(item.id)}
                            language={language}
                            compact
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {group.categories.map((item) => (
                          <CategoryNavButton
                            key={item.id}
                            item={item}
                            active={categoryId === item.id}
                            onClick={() => changeCategory(item.id)}
                            onPrefetch={() => prefetchCategory(item.id)}
                            language={language}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 rounded-b-2xl bg-gradient-to-t from-background/90 to-transparent" />
            </div>
          </aside>

          {/* Results */}
          <section className="min-w-0 flex-1">
            {error ? (
              <div className="flex h-72 flex-col items-center justify-center gap-4 rounded-3xl border border-white/5 bg-white/[0.02] text-muted-foreground">
                <p>{l('Couldn’t load titles. Please retry.', 'टाइटल्स लोड नहीं हो सके। फिर कोशिश करें।')}</p>
                <button
                    type="button"
                  onClick={() => setReloadKey((key) => key + 1)}
                    className="flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-4 py-2 transition-all hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
                >
                  <RefreshCw className="h-4 w-4" />
                  {l('Retry', 'फिर कोशिश करें')}
                </button>
              </div>
            ) : loading && items.length === 0 ? (
              <GridSkeleton />
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-white/[0.02] py-24 text-center">
                <LayoutGrid className="mb-4 h-10 w-10 text-white/15" />
                <p className="max-w-sm text-sm text-muted-foreground">
                  {language === 'hi'
                    ? `इस कैटेगरी में ${mediaLabel.toLowerCase()} के टाइटल्स नहीं मिले। दूसरी कैटेगरी या मीडिया चुनें।`
                    : `No titles in this category for ${mediaLabel.toLowerCase()}. Try another category or switch media.`}
                </p>
                <button
                  type="button"
                  onClick={() => changeType('all')}
                  className="mt-5 min-h-11 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
                >
                  {l('Show all media', 'सभी मीडिया दिखाएँ')}
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  <span>
                    {headingLabel} · {mediaLabel}
                  </span>
                  <span>
                    {l('Page', 'पेज')} {page} / {totalPages}
                  </span>
                </div>

                <div
                  className={`grid grid-cols-2 gap-5 transition-opacity duration-300 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 ${
                      loading ? 'pointer-events-none opacity-75' : 'opacity-100'
                  }`}
                >
                  {items.map((item) => {
                    const media = item.media_type ?? (type === 'tv' ? 'tv' : 'movie')
                    const href = media === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`
                    const language = item.original_language
                      ? LANGUAGE_BADGES[item.original_language]
                      : null

                    return (
                      <Link
                        key={`${media}:${item.id}`}
                        href={href}
                        prefetch={false}
                        className="group cursor-pointer"
                      >
                        <div className="relative mb-3 aspect-[2/3] overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/5 transition-all duration-300 group-hover:shadow-[0_10px_40px_-12px_hsla(var(--primary)/0.45)] group-hover:ring-primary/50">
                          {item.poster_path ? (
                            <Image
                              src={getImageUrl(item.poster_path, 'w342')}
                              alt={`${item.title} poster`}
                              fill
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
                              className="object-cover transition-transform duration-500 group-hover:scale-[1.06] motion-reduce:transition-none"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                              <Film className="h-8 w-8" aria-hidden="true" />
                              <span className="sr-only">{l('Poster unavailable', 'पोस्टर उपलब्ध नहीं')}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/75 px-2 py-0.5 backdrop-blur">
                            <Star className="h-3 w-3 fill-primary text-primary" />
                            <span className="text-[11px] font-bold">
                              {Number.isFinite(item.vote_average) ? item.vote_average.toFixed(1) : '—'}
                            </span>
                          </div>

                          <div className="absolute inset-x-2 bottom-2 flex items-center justify-between">
                            {media === 'tv' ? (
                              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-black">
                                {l('Series', 'सीरीज़')}
                              </span>
                            ) : (
                              <span />
                            )}
                            {language && (
                              <span className="rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white/80 backdrop-blur">
                                {language}
                              </span>
                            )}
                          </div>

                          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 text-black shadow-lg">
                              <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
                            </span>
                          </div>
                        </div>

                        <h2 className="line-clamp-2 min-h-10 text-sm font-medium leading-snug transition-colors group-hover:text-primary">
                          {item.title}
                        </h2>
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                          {item.release_date && Number.isFinite(new Date(item.release_date).getTime())
                            ? new Date(item.release_date).getFullYear()
                            : l('Release date unavailable', 'रिलीज़ डेट उपलब्ध नहीं')}
                          {genreNamesFor(item.genre_ids, 2).length > 0
                            ? ` · ${genreNamesFor(item.genre_ids, 2).join(' · ')}`
                            : ''}
                          {media === 'tv' ? ` · ${l('Series', 'सीरीज़')}` : ''}
                        </p>
                      </Link>
                    )
                  })}
                </div>

                {/* Pagination */}
                <div className="mt-10 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page === 1 || loading}
                    className="flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium transition-all hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {l('Previous', 'पिछला')}
                  </button>
                  <span className="min-w-[110px] text-center text-sm text-white/70">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={page >= totalPages || loading}
                    className="flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium transition-all hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {l('Next', 'अगला')}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
