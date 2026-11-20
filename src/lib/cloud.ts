'use client'

import {
  clearProfile,
  getProfileSnapshot,
  replaceProfile,
  type HistoryItem,
  type LocalProfile,
  type MediaKind,
} from '@/hooks/useLocalProfile'
import { getSupabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type WatchRow = Database['public']['Tables']['watch_history']['Row']
type WatchlistRow = Database['public']['Tables']['watchlist']['Row']
type LikeRow = Database['public']['Tables']['likes']['Row']
type PlaybackRow = Database['public']['Tables']['playback']['Row']

export interface CloudLibrary {
  history: WatchRow[]
  watchlist: WatchlistRow[]
  likes: LikeRow[]
  playback: PlaybackRow[]
}

const CLOUD_USER_KEY = 'cinehindi:cloud-user:v1'
const MAX_ROWS = 200

let cloudUserId: string | null = null

export const setCloudUser = (userId: string | null) => {
  cloudUserId = userId
}

export const getCloudUser = () => cloudUserId

const EMPTY_LIBRARY: CloudLibrary = {
  history: [],
  watchlist: [],
  likes: [],
  playback: [],
}

type BrowserSupabase = NonNullable<ReturnType<typeof getSupabase>>

// Actions fired right after a reload can run before AuthProvider sets cloudUserId.
const resolveUserId = async (supabase: BrowserSupabase) => {
  if (cloudUserId) return cloudUserId
  const { data, error } = await supabase.auth.getUser()
  return error ? null : data.user?.id ?? null
}

const isCurrentCloudUser = async (supabase: BrowserSupabase, userId: string) => {
  if (cloudUserId && cloudUserId !== userId) return false
  const { data, error } = await supabase.auth.getUser()
  return !error && data.user?.id === userId && (!cloudUserId || cloudUserId === userId)
}

const mediaType = (type: MediaKind) => type

export const fetchPlayback = async (tmdbId: number, type: MediaKind) => {
  const supabase = getSupabase()
  if (!supabase) return null

  const userId = cloudUserId ?? (await supabase.auth.getUser()).data.user?.id
  if (!userId) return null

  const { data } = await supabase
    .from('playback')
    .select('*')
    .eq('user_id', userId)
    .eq('media_type', mediaType(type))
    .eq('tmdb_id', tmdbId)
    .maybeSingle()

  if (!(await isCurrentCloudUser(supabase, userId))) return null
  return data ?? null
}

export const fetchLibrary = async (userId: string): Promise<CloudLibrary> => {
  const supabase = getSupabase()
  if (!supabase) return EMPTY_LIBRARY

  const [history, watchlist, likes, playback] = await Promise.all([
    supabase
      .from('watch_history')
      .select('*')
      .eq('user_id', userId)
      .order('watched_at', { ascending: false })
      .limit(MAX_ROWS),
    supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', userId)
      .order('added_at', { ascending: false })
      .limit(MAX_ROWS),
    supabase
      .from('likes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(MAX_ROWS),
    supabase
      .from('playback')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(MAX_ROWS),
  ])

  const failedQuery = [history, watchlist, likes, playback].find((result) => result.error)
  if (failedQuery?.error) {
    throw new Error('Unable to load your cloud library.')
  }
  if (!(await isCurrentCloudUser(supabase, userId))) {
    throw new Error('Your account changed while loading your library.')
  }

  return {
    history: history.data ?? [],
    watchlist: watchlist.data ?? [],
    likes: likes.data ?? [],
    playback: playback.data ?? [],
  }
}

export const pushView = async (item: Omit<HistoryItem, 'at'>) => {
  const supabase = getSupabase()
  if (!supabase) return
  const userId = await resolveUserId(supabase)
  if (!userId) return
  if (!(await isCurrentCloudUser(supabase, userId))) return

  const { error } = await supabase.from('watch_history').upsert(
    {
      user_id: userId,
      media_type: mediaType(item.type),
      tmdb_id: item.id,
      title: item.title,
      poster_path: item.poster,
      genres: item.genres,
      language: item.language ?? null,
      watched_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,media_type,tmdb_id' }
  )

  if (error) console.warn('Failed to sync watch history:', error.message)
}

export const pushPlayback = async (entry: {
  id: number
  type: MediaKind
  season?: number | null
  episode?: number | null
  title?: string | null
}) => {
  const supabase = getSupabase()
  if (!supabase) return
  const userId = await resolveUserId(supabase)
  if (!userId) return
  if (!(await isCurrentCloudUser(supabase, userId))) return

  const { error } = await supabase.from('playback').upsert(
    {
      user_id: userId,
      media_type: mediaType(entry.type),
      tmdb_id: entry.id,
      season: entry.season ?? null,
      episode: entry.episode ?? null,
      title: entry.title ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,media_type,tmdb_id' }
  )

  if (error) console.warn('Failed to sync playback:', error.message)
}

export const pushLike = async (
  item: { id: number; type: MediaKind; title?: string; poster?: string | null; genres?: number[] },
  liked: boolean
) => {
  const supabase = getSupabase()
  if (!supabase) return
  const userId = await resolveUserId(supabase)
  if (!userId) return
  if (!(await isCurrentCloudUser(supabase, userId))) return

  if (!liked) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('media_type', mediaType(item.type))
      .eq('tmdb_id', item.id)
    if (error) console.warn('Failed to remove favorite:', error.message)
    return
  }

  const { error } = await supabase.from('likes').upsert(
    {
      user_id: userId,
      media_type: mediaType(item.type),
      tmdb_id: item.id,
      title: item.title ?? null,
      poster_path: item.poster ?? null,
      genres: item.genres ?? [],
    },
    { onConflict: 'user_id,media_type,tmdb_id' }
  )
  if (error) console.warn('Failed to sync favorite:', error.message)
}

export const pushWatchlist = async (
  item: { id: number; type: MediaKind; title: string; poster?: string | null; genres?: number[]; language?: string },
  added: boolean
) => {
  const supabase = getSupabase()
  if (!supabase) return
  const userId = await resolveUserId(supabase)
  if (!userId) return
  if (!(await isCurrentCloudUser(supabase, userId))) return

  if (!added) {
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('media_type', mediaType(item.type))
      .eq('tmdb_id', item.id)
    if (error) console.warn('Failed to remove from watchlist:', error.message)
    return
  }

  const { error } = await supabase.from('watchlist').upsert(
    {
      user_id: userId,
      media_type: mediaType(item.type),
      tmdb_id: item.id,
      title: item.title,
      poster_path: item.poster ?? null,
      genres: item.genres ?? [],
      language: item.language ?? null,
    },
    { onConflict: 'user_id,media_type,tmdb_id' }
  )
  if (error) console.warn('Failed to sync watchlist:', error.message)
}

const mergeLocalIntoCloud = async (userId: string, library: CloudLibrary) => {
  const supabase = getSupabase()
  if (!supabase) return false

  const local = getProfileSnapshot()
  const key = (type: string, id: number) => `${type}:${id}`

  const historyKeys = new Set(library.history.map((row) => key(row.media_type, row.tmdb_id)))
  const watchlistKeys = new Set(library.watchlist.map((row) => key(row.media_type, row.tmdb_id)))
  const likeKeys = new Set(library.likes.map((row) => key(row.media_type, row.tmdb_id)))

  const history = local.history.filter((item) => !historyKeys.has(key(item.type, item.id)))
  const watchlist = local.watchlist.filter((item) => !watchlistKeys.has(key(item.type, item.id)))
  const likes = local.likes.filter((item) => !likeKeys.has(key(item.type, item.id)))

  if (history.length + watchlist.length + likes.length === 0) return false

  const writes: PromiseLike<unknown>[] = []

  if (history.length > 0) {
    writes.push(
      supabase.from('watch_history').upsert(
        history.map((item) => ({
          user_id: userId,
          media_type: item.type,
          tmdb_id: item.id,
          title: item.title,
          poster_path: item.poster,
          genres: item.genres,
          language: item.language ?? null,
          watched_at: new Date(item.at).toISOString(),
        })),
        { onConflict: 'user_id,media_type,tmdb_id' }
      )
    )
  }

  if (watchlist.length > 0) {
    writes.push(
      supabase.from('watchlist').upsert(
        watchlist.map((item) => ({
          user_id: userId,
          media_type: item.type,
          tmdb_id: item.id,
          title: item.title,
          poster_path: item.poster,
          genres: item.genres,
          language: item.language ?? null,
          added_at: new Date(item.at).toISOString(),
        })),
        { onConflict: 'user_id,media_type,tmdb_id' }
      )
    )
  }

  if (likes.length > 0) {
    writes.push(
      supabase.from('likes').upsert(
        likes.map((item) => ({
          user_id: userId,
          media_type: item.type,
          tmdb_id: item.id,
          title: item.title ?? null,
          poster_path: item.poster ?? null,
          genres: item.genres ?? [],
          created_at: new Date(item.at).toISOString(),
        })),
        { onConflict: 'user_id,media_type,tmdb_id' }
      )
    )
  }

  const results = await Promise.all(writes)
  if (results.some((result) => Boolean((result as { error?: unknown }).error))) {
    throw new Error('Unable to sync your saved library.')
  }
  return true
}

const hydrateLocal = (library: CloudLibrary) => {
  const profile: LocalProfile = {
    v: 1,
    history: library.history.map((row) => ({
      id: row.tmdb_id,
      type: row.media_type as MediaKind,
      title: row.title,
      poster: row.poster_path,
      genres: row.genres ?? [],
      language: row.language ?? undefined,
      at: Date.parse(row.watched_at),
    })),
    likes: library.likes.map((row) => ({
      id: row.tmdb_id,
      type: row.media_type as MediaKind,
      at: Date.parse(row.created_at),
      title: row.title ?? undefined,
      poster: row.poster_path,
      genres: row.genres ?? [],
    })),
    watchlist: library.watchlist.map((row) => ({
      id: row.tmdb_id,
      type: row.media_type as MediaKind,
      title: row.title,
      poster: row.poster_path,
      genres: row.genres ?? [],
      language: row.language ?? undefined,
      at: Date.parse(row.added_at),
    })),
    updatedAt: Date.now(),
  }

  replaceProfile(profile)
}

/**
 * First sign-in migrates this browser's guest library into the account.
 * Only rows the account is missing are written, so cloud data is never clobbered.
 */
export const syncOnSignIn = async (userId: string) => {
  try {
    const supabase = getSupabase()
    if (!supabase) return false

    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || authData.user?.id !== userId) return false

    const lastUser =
      typeof window !== 'undefined' ? window.localStorage.getItem(CLOUD_USER_KEY) : null

    let library = await fetchLibrary(userId)
    const { data: latestAuthData, error: latestAuthError } = await supabase.auth.getUser()
    if (latestAuthError || latestAuthData.user?.id !== userId) return false

    const merged = await mergeLocalIntoCloud(userId, library)
    if (merged) library = await fetchLibrary(userId)

    const { data: finalAuthData, error: finalAuthError } = await supabase.auth.getUser()
    if (
      finalAuthError ||
      finalAuthData.user?.id !== userId ||
      (cloudUserId !== null && cloudUserId !== userId)
    ) return false

    if (lastUser && lastUser !== userId) {
      clearProfile()
    }
    hydrateLocal(library)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CLOUD_USER_KEY, userId)
    }
    return true
  } catch (error) {
    console.warn('Profile sync failed:', error)
    return false
  }
}

export const detachUser = () => {
  cloudUserId = null
  clearProfile()
  try {
    window.localStorage.removeItem(CLOUD_USER_KEY)
  } catch {
    // ignore
  }
}
