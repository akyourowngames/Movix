'use client'

import { useEffect, useMemo, useState } from 'react'
import MovieCarousel from './MovieCarousel'
import { MediaSkeleton } from '@/components/ui/MediaSkeleton'
import { getImageUrl, type CatalogItem } from '@/lib/catalog'
import { genreNamesFor } from '@/lib/genres'
import type { Movie } from '@/lib/data'
import {
  isEligibleForYou,
  mostRecentSeed,
  selectExcludes,
  selectGenreWeights,
  selectLanguages,
  useLocalProfile,
} from '@/hooks/useLocalProfile'

type Kind = 'for-you' | 'because-watched'

const CACHE_TTL = 10 * 60 * 1000
const cache = new Map<string, { items: CatalogItem[]; ts: number }>()

const toMovie = (item: CatalogItem): Movie => ({
  id: String(item.id),
  title: item.title,
  poster: getImageUrl(item.poster_path, 'w342'),
  genre: genreNamesFor(item.genre_ids),
  year:
    item.release_date && Number.isFinite(new Date(item.release_date).getTime())
      ? new Date(item.release_date).getFullYear()
      : undefined,
  rating: Number.isFinite(item.vote_average)
    ? Math.round(item.vote_average * 10) / 10
    : 0,
  quality: item.vote_average >= 7.5 ? '4K' : 'HD',
  mediaType: item.media_type,
  language:
    item.original_language === 'hi'
      ? 'HI'
      : item.original_language === 'en'
        ? 'EN'
        : 'GL',
})

function PersonalSkeleton({ label }: { label: string }) {
  return (
    <section className="page-shell py-8">
      <div className="mb-5">
        <div className="skeleton-surface mb-2 h-7 w-52 rounded" aria-hidden="true" />
        <div className="skeleton-surface h-3 w-36 rounded" aria-hidden="true" />
      </div>
      <MediaSkeleton count={6} label={`${label} loading`} className="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" />
    </section>
  )
}

export default function PersonalRows({ kind }: { kind: Kind }) {
  const { profile, ready } = useLocalProfile()
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  const seed = kind === 'because-watched' ? mostRecentSeed(profile) : undefined

  const query = useMemo(() => {
    if (kind === 'for-you') {
      if (!isEligibleForYou(profile)) return ''
    } else if (!mostRecentSeed(profile)) {
      return ''
    }

    const params = new URLSearchParams()

    if (kind === 'for-you') {
      const seeds = profile.history
        .slice(0, 4)
        .map((item) => `${item.type}:${item.id}`)
      if (seeds.length > 0) params.set('seeds', seeds.join(','))
    } else {
      const recent = mostRecentSeed(profile)
      if (!recent) return ''
      params.set('seeds', `${recent.type}:${recent.id}`)
    }

    const genres = selectGenreWeights(profile)
    if (genres.length > 0) params.set('genres', genres.join(','))

    const langs = selectLanguages(profile)
    if (langs.length > 0) params.set('langs', langs.join(','))

    const excludes = selectExcludes(profile)
    if (excludes.length > 0) params.set('exclude', excludes.join(','))

    params.set('limit', '18')
    return params.toString()
  }, [kind, profile])

  useEffect(() => {
    if (!ready || !query) {
      setItems([])
      setLoading(false)
      setError(false)
      return
    }

    const cached = cache.get(query)
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setItems(cached.items)
      setLoading(false)
      setError(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(false)

    fetch(`/api/recommend?${query}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Recommendation request failed (${res.status})`)
        return res.json()
      })
      .then((data) => {
        if (data.reason === 'unavailable') throw new Error('Recommendation data unavailable')
        const results: CatalogItem[] = data.results || []
        cache.set(query, { items: results, ts: Date.now() })
        setItems(results)
        setLoading(false)
      })
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') {
          setError(true)
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [ready, query, retryKey])

  if (!ready) return null

  if (loading && items.length === 0) {
    return (
      <PersonalSkeleton
        label={kind === 'for-you' ? 'For You' : 'Because You Watched'}
      />
    )
  }

  if (error && items.length === 0) {
    return (
      <section className="container mx-auto max-w-7xl px-6 py-8" aria-labelledby={`${kind}-recommendations-error`}>
        <div role="alert" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div>
            <h2 id={`${kind}-recommendations-error`} className="font-semibold">
              {kind === 'for-you' ? 'For You' : 'Because You Watched'} isn&apos;t available right now
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Your watch history is unchanged. Try loading recommendations again.</p>
          </div>
          <button
            type="button"
            onClick={() => setRetryKey((key) => key + 1)}
            className="min-h-11 rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
          >
            Retry
          </button>
        </div>
      </section>
    )
  }

  if (kind === 'because-watched') {
    if (!seed || items.length < 8) return null
    return (
      <MovieCarousel
        title={`Because You Watched ${seed.title}`}
        hindiTitle={`क्योंकि आपने ${seed.title} देखा`}
        subtitle="More like this"
        movies={items.map(toMovie)}
      />
    )
  }

  if (items.length === 0) return null

  return (
    <MovieCarousel
      title="For You"
      hindiTitle="आपके लिए"
      subtitle="Based on your watch history"
      movies={items.map(toMovie)}
    />
  )
}
