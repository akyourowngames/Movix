'use client'

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Clock, Film, Heart, History, Loader2, Play, Plus, Sparkles, UserCog } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { useLocalProfile, type HistoryItem, type LikeItem } from '@/hooks/useLocalProfile'
import { fetchLibrary, type CloudLibrary } from '@/lib/cloud'
import { getImageUrl } from '@/lib/catalog'
import { GENRE_NAMES } from '@/lib/genres'

type MediaKind = 'movie' | 'tv'

interface Entry {
  id: number
  type: MediaKind
  title: string
  poster: string | null
  genres: number[]
  at: number
}

interface ContinueEntry extends Entry {
  season?: number | null
  episode?: number | null
  serverId?: string
  serverName?: string
}

type TabId = 'continue' | 'watchlist' | 'favorites' | 'history'

const tabs = [
  { id: 'continue' as TabId, label: 'Continue Watching', hindi: 'देखना जारी रखें', icon: Play },
  { id: 'watchlist' as TabId, label: 'My Watchlist', hindi: 'मेरी वॉचलिस्ट', icon: Film },
  { id: 'favorites' as TabId, label: 'Favorites', hindi: 'पसंदीदा', icon: Heart },
  { id: 'history' as TabId, label: 'Watch History', hindi: 'इतिहास', icon: History },
]

const fromHistory = (items: HistoryItem[]): Entry[] =>
  items.map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    poster: item.poster,
    genres: item.genres ?? [],
    at: item.at,
  }))

const fromLikes = (items: LikeItem[]): Entry[] =>
  items
    .filter((item) => Boolean(item.title))
    .map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title as string,
      poster: item.poster ?? null,
      genres: item.genres ?? [],
      at: item.at,
    }))

const fromCloudHistory = (library: CloudLibrary): Entry[] =>
  library.history.map((row) => ({
    id: row.tmdb_id,
    type: row.media_type as MediaKind,
    title: row.title,
    poster: row.poster_path,
    genres: row.genres ?? [],
    at: Date.parse(row.watched_at),
  }))

const fromCloudWatchlist = (library: CloudLibrary): Entry[] =>
  library.watchlist.map((row) => ({
    id: row.tmdb_id,
    type: row.media_type as MediaKind,
    title: row.title,
    poster: row.poster_path,
    genres: row.genres ?? [],
    at: Date.parse(row.added_at),
  }))

const fromCloudLikes = (library: CloudLibrary): Entry[] =>
  library.likes
    .filter((row) => Boolean(row.title))
    .map((row) => ({
      id: row.tmdb_id,
      type: row.media_type as MediaKind,
      title: row.title as string,
      poster: row.poster_path,
      genres: row.genres ?? [],
      at: Date.parse(row.created_at),
    }))

const fromLocalPlayback = (local: { playback: Array<{ id: number; type: MediaKind; title?: string; poster?: string | null; genres?: number[]; season?: number | null; episode?: number | null; serverId?: string; serverName?: string; at: number }>; history: HistoryItem[] }): ContinueEntry[] =>
  local.playback.map((row) => {
    const meta = local.history.find((item) => item.id === row.id && item.type === row.type)
    return {
      id: row.id,
      type: row.type,
      title: meta?.title ?? row.title ?? 'Untitled',
      poster: meta?.poster ?? row.poster ?? null,
      genres: meta?.genres ?? row.genres ?? [],
      at: row.at,
      season: row.season,
      episode: row.episode,
      serverId: row.serverId,
      serverName: row.serverName,
    }
  })

const fromCloudPlayback = (library: CloudLibrary, localPlayback: Array<{ id: number; type: MediaKind; serverId?: string; serverName?: string }> = []): ContinueEntry[] =>
  library.playback.map((row) => {
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

    const saved = localPlayback.find(
      (item) => item.id === row.tmdb_id && item.type === row.media_type
    )
    return {
      id: row.tmdb_id,
      type: row.media_type as MediaKind,
      title: meta?.title ?? row.title ?? 'Untitled',
      poster: meta?.poster_path ?? null,
      genres: meta?.genres ?? [],
      at: Date.parse(row.updated_at),
      season: row.season,
      episode: row.episode,
      serverId: saved?.serverId ?? row.server ?? undefined,
      serverName: saved?.serverName,
    }
  })

function LibraryCard({ entry, delay, resume }: { entry: Entry; delay: number; resume?: ContinueEntry }) {
  const params = new URLSearchParams()
  if (entry.type === 'tv' && resume?.season) {
    params.set('s', String(resume.season))
    params.set('e', String(resume.episode ?? 1))
  }
  if (resume?.serverId) params.set('server', resume.serverId)
  const query = params.toString()
  const href = `/${entry.type}/${entry.id}${query ? `?${query}` : ''}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(delay, 12) * 0.04 }}
    >
      <Link href={href} prefetch={false}>
        <div className="group cursor-pointer">
          <div className="relative mb-3 aspect-[2/3] overflow-hidden rounded-xl bg-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getImageUrl(entry.poster, 'w342')}
              alt={entry.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            {resume?.season && (
              <span className="absolute bottom-2 left-2 rounded bg-black/80 px-2 py-0.5 text-[10px] font-semibold tracking-wide">
                S{resume.season} E{resume.episode ?? 1}
              </span>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
              <Play className="h-12 w-12 text-white" fill="white" />
            </div>
          </div>
          <p className="line-clamp-2 text-sm font-medium transition-colors group-hover:text-primary">
            {entry.title}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {entry.genres.map((genre) => GENRE_NAMES[genre]).filter(Boolean).slice(0, 2).join(' • ') ||
              (entry.type === 'tv' ? 'Series' : 'Movie')}
          </p>
        </div>
      </Link>
    </motion.div>
  )
}

function EmptyState({ tab }: { tab: TabId }) {
  const copy: Record<TabId, string> = {
    continue: 'Open a movie or TV episode and it will show up here, ready to resume.',
    watchlist: 'Your watchlist is empty. Tap the + on any poster to save it.',
    favorites: 'Nothing in favorites yet. Tap the heart on any poster.',
    history: 'No watch history yet. Your viewing trail will appear here.',
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] py-20 text-center">
      <Film className="mx-auto mb-4 h-12 w-12 text-white/15" />
      <p className="mb-6 max-w-sm text-sm text-muted-foreground mx-auto">{copy[tab]}</p>
      <Link
        href="/browse"
        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-primary/90"
      >
        <Sparkles className="h-4 w-4" />
        Browse movies
      </Link>
    </div>
  )
}

export default function ProfilePage() {
  const {
    user,
    profile: account,
    profileError,
    librarySyncError,
    retryLibrarySync,
    loading: authLoading,
    syncing,
    refreshProfile,
  } = useAuth()
  const { profile: local, ready } = useLocalProfile()
  const [tab, setTab] = useState<TabId>('continue')
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [libraryState, setLibraryState] = useState<{ userId: string; data: CloudLibrary } | null>(null)
  const [loadingLibrary, setLoadingLibrary] = useState(false)
  const [libraryErrorUserId, setLibraryErrorUserId] = useState<string | null>(null)
  const [libraryReloadKey, setLibraryReloadKey] = useState(0)

  const userId = user?.id ?? null
  const library = libraryState?.userId === userId ? libraryState.data : null

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex: number | null = null
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = tabs.length - 1
    if (nextIndex === null) return

    event.preventDefault()
    const nextTab = tabs[nextIndex]
    setTab(nextTab.id)
    tabRefs.current[nextIndex]?.focus()
  }

  useEffect(() => {
    if (!userId) {
      setLibraryState(null)
      setLoadingLibrary(false)
      setLibraryErrorUserId(null)
      return
    }
    if (syncing) {
      setLoadingLibrary(true)
      return
    }

    let cancelled = false
    setLoadingLibrary(true)
    setLibraryErrorUserId(null)

    fetchLibrary(userId)
      .then((data) => {
        if (!cancelled) {
          setLibraryState({ userId, data })
          setLoadingLibrary(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadingLibrary(false)
          setLibraryErrorUserId(userId)
        }
      })

    return () => {
      cancelled = true
    }
  }, [userId, syncing, libraryReloadKey])

  const entries = useMemo(() => {
    if (userId && library) {
      return {
        continue: fromCloudPlayback(library, local.playback),
        watchlist: fromCloudWatchlist(library),
        favorites: fromCloudLikes(library),
        history: fromCloudHistory(library),
      }
    }

    return {
      continue: fromLocalPlayback(local),
      watchlist: fromHistory(local.watchlist),
      favorites: fromLikes(local.likes),
      history: fromHistory(local.history),
    }
  }, [userId, library, local])

  const topGenre = useMemo(() => {
    const counts = new Map<number, number>()
    entries.history.forEach((entry) =>
      entry.genres.forEach((genre) => counts.set(genre, (counts.get(genre) ?? 0) + 1))
    )
    const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]
    return top ? GENRE_NAMES[top[0]] ?? '—' : '—'
  }, [entries.history])

  const stats = [
    { icon: Film, value: entries.history.length, label: 'Titles watched', hindi: 'देखी गई फिल्में' },
    { icon: Clock, value: entries.watchlist.length, label: 'In watchlist', hindi: 'वॉचलिस्ट' },
    { icon: Heart, value: entries.favorites.length, label: 'Favorites', hindi: 'पसंदीदा' },
    { icon: Sparkles, value: topGenre, label: 'Top genre', hindi: 'पसंदीदा शैली' },
  ]

  const loadingData = authLoading || (userId ? (syncing || loadingLibrary) && !library : !ready)

  const displayName = account?.display_name || user?.email?.split('@')[0] || 'Guest'
  const initial = (displayName[0] || 'G').toUpperCase()
  const memberSince = account?.created_at
    ? new Date(account.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null
  const activeEntries = tab === 'continue' ? entries.continue : entries[tab]

  return (
    <main className="min-h-screen bg-background pb-32 pt-24">
      <div className="page-shell">
        {/* Header */}
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-6">
            {user && account?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={account.avatar_url}
                alt={displayName}
                className="h-24 w-24 rounded-full border-2 border-white/10 object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/40 text-3xl font-bold text-black">
                {initial}
              </div>
            )}
            <div>
              <h1 className="mb-1 font-display text-3xl font-bold sm:text-4xl">
                {user ? displayName : 'Guest profile'}
              </h1>
              {user ? (
                <p className="text-muted-foreground">
                  {user.email}
                  {memberSince ? ` · Member since ${memberSince}` : ''}
                </p>
              ) : (
                <p className="max-w-md text-sm text-muted-foreground">
                  Your library is saved on this device. Sign in to sync it across devices and pick up exactly where you left off.
                </p>
              )}
              {syncing && (
                <p className="mt-2 flex items-center gap-2 text-xs text-primary">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Syncing your library…
                </p>
              )}
              {profileError && (
                <div role="status" className="mt-2 flex flex-wrap items-center gap-2 text-xs text-red-300">
                  <span>{profileError}</span>
                  <button
                    type="button"
                    onClick={() => void refreshProfile().catch(() => undefined)}
                    className="min-h-11 rounded-full border border-red-300/40 px-3 font-medium text-red-100 underline-offset-2 hover:bg-red-300/10 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Retry
                  </button>
                </div>
              )}
              {librarySyncError && (
                <div role="status" className="mt-2 flex flex-wrap items-center gap-2 text-xs text-amber-200">
                  <span>Your cloud sync did not finish. Your local library is still available on this device.</span>
                  <button
                    type="button"
                    onClick={() => void retryLibrarySync()}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-amber-200/40 px-3 font-medium text-amber-100 underline-offset-2 hover:bg-amber-200/10 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
                  >
                    Retry sync
                  </button>
                </div>
              )}
            </div>
          </div>

          {!user && !authLoading && (
            <div className="flex shrink-0 gap-3">
              <Link
                href="/login?next=/profile"
                className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
              >
                Sign in
              </Link>
              <Link
                href="/signup?next=/profile"
                className="flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
              >
                <Plus className="h-4 w-4" />
                Create account
              </Link>
            </div>
          )}

          {user && (
            <div className="flex shrink-0 gap-3">
              <Link
                href="/account"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
              >
                <UserCog className="h-4 w-4" aria-hidden="true" />
                Account settings
              </Link>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                whileHover={{ scale: 1.02 }}
                className="border border-white/10 bg-card p-5 md:p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/20">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-2xl font-bold md:text-3xl">{stat.value}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {stat.label} <span className="hidden lg:inline">/ {stat.hindi}</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Profile library sections"
          className="mb-8 flex gap-3 overflow-x-auto pb-2"
        >
          {tabs.map((item, index) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                ref={(element) => { tabRefs.current[index] = element }}
                id={`profile-tab-${item.id}`}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                aria-controls="profile-library-panel"
                tabIndex={tab === item.id ? 0 : -1}
                onClick={() => setTab(item.id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={`flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-5 py-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none ${
                  tab === item.id
                    ? 'bg-primary text-black'
                    : 'bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                <span className="hidden text-xs opacity-70 sm:inline">/ {item.hindi}</span>
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div
          id="profile-library-panel"
          role="tabpanel"
          aria-labelledby={`profile-tab-${tab}`}
          tabIndex={0}
          className="min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
        {loadingData ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="skeleton-surface mb-3 aspect-[2/3] rounded-lg" />
                <div className="skeleton-surface mb-2 h-3 w-3/4 rounded" />
                <div className="skeleton-surface h-2.5 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : userId && libraryErrorUserId === userId ? (
          <div role="alert" className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
            <p className="mb-5 text-sm text-muted-foreground">
              We couldn&apos;t load your cloud library. Your saved items have not been changed.
            </p>
            <button
              type="button"
              onClick={() => setLibraryReloadKey((key) => key + 1)}
              className="min-h-11 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
            >
              Retry loading library
            </button>
          </div>
        ) : activeEntries.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {activeEntries.map((entry, index) => (
              <LibraryCard
                key={`${entry.type}:${entry.id}`}
                entry={entry}
                delay={index}
                resume={tab === 'continue' ? (entry as ContinueEntry) : undefined}
              />
            ))}
          </div>
        )}
        </div>

        {!user && !authLoading && entries.history.length > 0 && (
          <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:flex-row sm:items-center">
            <div>
              <p className="font-display text-lg font-semibold">Keep your progress across devices</p>
              <p className="text-sm text-muted-foreground">
                Create a free account and we&apos;ll move this library into it automatically.
              </p>
            </div>
            <Link
              href="/signup?next=/profile"
              className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
            >
              Sync my library
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
