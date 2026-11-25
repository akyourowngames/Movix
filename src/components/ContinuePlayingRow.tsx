'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Play, Clock } from 'lucide-react'
import { useLocalProfile, type HistoryItem, type PlaybackItem } from '@/hooks/useLocalProfile'
import { useAuth } from '@/components/AuthProvider'
import { fetchLibrary, type CloudLibrary } from '@/lib/cloud'
import { getImageUrl } from '@/lib/catalog'

interface ContinueItem {
  id: number
  type: 'movie' | 'tv'
  title: string
  poster: string | null
  season?: number | null
  episode?: number | null
  serverId?: string
  serverName?: string
  at: number
}

const keyOf = (type: string, id: number) => `${type}:${id}`

const fromLocal = (playback: PlaybackItem[], history: HistoryItem[]): ContinueItem[] =>
  playback.map((item) => {
    const meta = history.find((entry) => entry.id === item.id && entry.type === item.type)
    return {
      id: item.id,
      type: item.type,
      title: meta?.title || item.title || 'Untitled',
      poster: meta?.poster ?? item.poster ?? null,
      season: item.season,
      episode: item.episode,
      serverId: item.serverId,
      serverName: item.serverName,
      at: item.at,
    }
  })

const fromCloud = (library: CloudLibrary, local: ContinueItem[]): ContinueItem[] => {
  const localByKey = new Map(local.map((item) => [keyOf(item.type, item.id), item]))
  return library.playback.map((row) => {
    const meta =
      library.history.find(
        (item) => item.media_type === row.media_type && item.tmdb_id === row.tmdb_id
      ) ??
      library.watchlist.find(
        (item) => item.media_type === row.media_type && item.tmdb_id === row.tmdb_id
      ) ??
      library.likes.find(
        (item) => item.media_type === row.media_type && item.tmdb_id === row.tmdb_id
      )
    const saved = localByKey.get(keyOf(row.media_type, row.tmdb_id))
    return {
      id: row.tmdb_id,
      type: row.media_type === 'movie' ? 'movie' : 'tv',
      title: meta?.title ?? row.title ?? saved?.title ?? 'Untitled',
      poster: meta?.poster_path ?? saved?.poster ?? null,
      season: row.season ?? saved?.season,
      episode: row.episode ?? saved?.episode,
      serverId: saved?.serverId ?? row.server ?? undefined,
      serverName: saved?.serverName,
      at: Date.parse(row.updated_at),
    }
  })
}

export default function ContinuePlayingRow() {
  const { profile, ready } = useLocalProfile()
  const { user } = useAuth()
  const [cloud, setCloud] = useState<CloudLibrary | null>(null)

  useEffect(() => {
    if (!user?.id) {
      setCloud(null)
      return
    }
    let cancelled = false
    fetchLibrary(user.id)
      .then((library) => {
        if (!cancelled) setCloud(library)
      })
      .catch(() => {
        if (!cancelled) setCloud(null)
      })
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const items = useMemo(() => {
    if (!ready) return []
    const local = fromLocal(profile.playback, profile.history)
    const merged = new Map(local.map((item) => [keyOf(item.type, item.id), item]))

    if (cloud) {
      for (const item of fromCloud(cloud, local)) {
        const existing = merged.get(keyOf(item.type, item.id))
        if (!existing) {
          merged.set(keyOf(item.type, item.id), item)
          continue
        }
        merged.set(keyOf(item.type, item.id), {
          ...existing,
          season: existing.season ?? item.season,
          episode: existing.episode ?? item.episode,
          at: Math.max(existing.at, item.at),
        })
      }
    }

    return Array.from(merged.values())
      .sort((a, b) => b.at - a.at)
      .slice(0, 18)
  }, [profile.playback, profile.history, cloud, ready])

  if (!items.length) return null

  return (
    <section className="group relative overflow-hidden py-7 md:py-9">
      <div className="page-shell mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Continue Playing
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground md:text-sm">
            <Clock className="h-3.5 w-3.5" />
            Pick up exactly where you left off
          </p>
        </div>
      </div>

      <div className="page-shell flex snap-x snap-mandatory gap-4 overflow-x-auto hide-scrollbar pb-3 pt-1 sm:gap-5">
        {items.map((item) => {
          const params = new URLSearchParams()
          if (item.type === 'tv' && item.season) {
            params.set('s', String(item.season))
            params.set('e', String(item.episode ?? 1))
          }
          if (item.serverId) params.set('server', item.serverId)
          const query = params.toString()
          const href = `/${item.type}/${item.id}${query ? `?${query}` : ''}`
          const progress =
            item.type === 'tv' && item.season
              ? `S${item.season} E${item.episode ?? 1}`
              : 'Movie'

          return (
            <Link
              key={keyOf(item.type, item.id)}
              href={href}
              prefetch={false}
              className="group/card w-[min(39vw,176px)] flex-none snap-start sm:w-[190px] md:w-[206px] lg:w-[216px]"
            >
              <div className="relative mb-2 aspect-[2/3] overflow-hidden rounded-xl bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getImageUrl(item.poster, 'w342')}
                  alt={`${item.title} poster`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <span className="absolute bottom-2 left-2 rounded bg-black/80 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white">
                  {progress}
                </span>
                {item.serverName && (
                  <span className="absolute bottom-2 right-2 max-w-[45%] truncate rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-medium text-white/75">
                    {item.serverName}
                  </span>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover/card:opacity-100">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-black shadow-lg">
                    <Play className="h-6 w-6" fill="currentColor" />
                  </span>
                </div>
              </div>
              <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-white">
                {item.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {progress}
                {item.serverName ? ` • ${item.serverName}` : ''}
              </p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
