'use client'

import {
  addToWatchlist,
  getProfileSnapshot,
  removeFromWatchlist,
  toggleLike as toggleLocalLike,
  trackView,
  type HistoryItem,
  type MediaKind,
} from '@/hooks/useLocalProfile'
import { pushLike, pushPlayback, pushView, pushWatchlist } from '@/lib/cloud'

export const recordView = (item: Omit<HistoryItem, 'at'>) => {
  trackView(item)
  void pushView(item)
}

export const recordPlayback = (entry: {
  id: number
  type: MediaKind
  season?: number | null
  episode?: number | null
  title?: string | null
}) => {
  void pushPlayback(entry)
}

export const toggleMediaLike = (item: {
  id: number
  type: MediaKind
  title?: string
  poster?: string | null
  genres?: number[]
}) => {
  const snapshot = getProfileSnapshot()
  const liked = !snapshot.likes.some(
    (entry) => entry.id === item.id && entry.type === item.type
  )

  toggleLocalLike(item.id, item.type, {
    title: item.title,
    poster: item.poster,
    genres: item.genres,
  })
  void pushLike(item, liked)
}

export const toggleMediaWatchlist = (item: Omit<HistoryItem, 'at'>) => {
  const snapshot = getProfileSnapshot()
  const added = !snapshot.watchlist.some(
    (entry) => entry.id === item.id && entry.type === item.type
  )

  if (added) {
    addToWatchlist(item)
  } else {
    removeFromWatchlist(item.id, item.type)
  }
  void pushWatchlist(item, added)
}
