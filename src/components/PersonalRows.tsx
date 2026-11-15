'use client'

import { useEffect, useMemo, useState } from 'react'
import MovieCarousel from './MovieCarousel'
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
  year: item.release_date ? new Date(item.release_date).getFullYear() : undefined,
  rating: Math.round(item.vote_average * 10) / 10,
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
    <section className="relative py-12 overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl mb-6">
        <div className="h-9 w-56 bg-white/5 rounded animate-pulse mb-2" />
        <div className="h-3 w-32 bg-white/5 rounded animate-pulse" />
      </div>
      <div className="flex gap-6 px-6 overflow-hidden">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex-none w-[200px] md:w-[240px] aspect-[2/3] rounded-xl bg-white/5 animate-pulse"
          />
        ))}
      </div>
      <span className="sr-only">{label} loading</span>
    </section>
  )
}

export default function PersonalRows({ kind }: { kind: Kind }) {
  const { profile, ready } = useLocalProfile()
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(false)

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
      return
    }

    const cached = cache.get(query)
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setItems(cached.items)
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)

    fetch(`/api/recommend?${query}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : { results: [] }))
      .then((data) => {
        const results: CatalogItem[] = data.results || []
        cache.set(query, { items: results, ts: Date.now() })
        setItems(results)
        setLoading(false)
      })
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') setLoading(false)
      })

    return () => controller.abort()
  }, [ready, query])

  if (!ready) return null

  if (loading && items.length === 0) {
    return (
      <PersonalSkeleton
        label={kind === 'for-you' ? 'For You' : 'Because You Watched'}
      />
    )
  }

  if (kind === 'because-watched') {
    if (!seed || items.length < 8) return null
    return (
      <MovieCarousel
        title={`Because You Watched ${seed.title}`}
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
