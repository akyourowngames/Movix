'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'cinehindi:profile:v1'
const MAX_HISTORY = 50
const MAX_LIKES = 100
const MAX_WATCHLIST = 50
const MAX_AGE_MS = 180 * 86_400_000
const VIEW_DEDUPE_MS = 30 * 60 * 1000

export type MediaKind = 'movie' | 'tv'

export interface HistoryItem {
  id: number
  type: MediaKind
  title: string
  poster: string | null
  genres: number[]
  language?: string
  at: number
}

export interface ProfileRef {
  id: number
  type: MediaKind
  at: number
}

export interface LocalProfile {
  v: 1
  history: HistoryItem[]
  likes: ProfileRef[]
  watchlist: HistoryItem[]
  updatedAt: number
}

const EMPTY_PROFILE: LocalProfile = {
  v: 1,
  history: [],
  likes: [],
  watchlist: [],
  updatedAt: 0,
}

let snapshot: LocalProfile = EMPTY_PROFILE
let loaded = false
let degraded = false
let storageBound = false
const listeners = new Set<() => void>()

const notify = () => {
  listeners.forEach((listener) => listener())
}

const validProfile = (value: unknown): value is LocalProfile => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<LocalProfile>
  return (
    candidate.v === 1 &&
    Array.isArray(candidate.history) &&
    Array.isArray(candidate.likes) &&
    Array.isArray(candidate.watchlist)
  )
}

const pruneProfile = (profile: LocalProfile): LocalProfile => {
  const cutoff = Date.now() - MAX_AGE_MS
  const recent = <T extends { at: number }>(items: T[], max: number) =>
    items.filter((item) => item.at >= cutoff).slice(0, max)

  return {
    v: 1,
    history: recent(profile.history, MAX_HISTORY),
    likes: recent(profile.likes, MAX_LIKES),
    watchlist: recent(profile.watchlist, MAX_WATCHLIST),
    updatedAt: profile.updatedAt,
  }
}

const ensureLoaded = () => {
  if (loaded || degraded) return
  loaded = true
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed: unknown = JSON.parse(raw)
    if (validProfile(parsed)) snapshot = pruneProfile(parsed)
  } catch {
    // storage unavailable — stay in memory
  }
}

const persist = (next: LocalProfile) => {
  snapshot = next
  if (!degraded) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      try {
        const trimmed = { ...next, history: next.history.slice(0, 10) }
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
        snapshot = trimmed
      } catch {
        degraded = true
      }
    }
  }
  notify()
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)

  if (!storageBound && typeof window !== 'undefined') {
    storageBound = true
    window.addEventListener('storage', (event) => {
      if (event.key !== STORAGE_KEY) return
      loaded = false
      ensureLoaded()
      notify()
    })
  }

  return () => {
    listeners.delete(listener)
  }
}

const getSnapshot = () => snapshot
const getServerSnapshot = () => EMPTY_PROFILE

export const useLocalProfile = () => {
  const profile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ensureLoaded()
    setReady(true)
    notify()
  }, [])

  return { profile, ready }
}

export const trackView = (item: Omit<HistoryItem, 'at'>) => {
  ensureLoaded()
  const now = Date.now()
  const existing = snapshot.history.find(
    (entry) => entry.id === item.id && entry.type === item.type
  )
  if (existing && now - existing.at < VIEW_DEDUPE_MS) return

  const history = [
    { ...item, at: now },
    ...snapshot.history.filter(
      (entry) => !(entry.id === item.id && entry.type === item.type)
    ),
  ].slice(0, MAX_HISTORY)

  persist({ ...snapshot, history, updatedAt: now })
}

export const toggleLike = (id: number, type: MediaKind) => {
  ensureLoaded()
  const now = Date.now()
  const exists = snapshot.likes.some((entry) => entry.id === id && entry.type === type)
  const likes = exists
    ? snapshot.likes.filter((entry) => !(entry.id === id && entry.type === type))
    : [{ id, type, at: now }, ...snapshot.likes].slice(0, MAX_LIKES)

  persist({ ...snapshot, likes, updatedAt: now })
}

export const addToWatchlist = (item: Omit<HistoryItem, 'at'>) => {
  ensureLoaded()
  const now = Date.now()
  const watchlist = [
    { ...item, at: now },
    ...snapshot.watchlist.filter(
      (entry) => !(entry.id === item.id && entry.type === item.type)
    ),
  ].slice(0, MAX_WATCHLIST)

  persist({ ...snapshot, watchlist, updatedAt: now })
}

export const clearProfile = () => {
  snapshot = EMPTY_PROFILE
  loaded = true
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
  notify()
}

export const isEligibleForYou = (profile: LocalProfile) => {
  const unique = new Set(profile.history.map((item) => `${item.type}:${item.id}`))
  return unique.size >= 3 || profile.likes.length >= 2
}

export const mostRecentSeed = (profile: LocalProfile): HistoryItem | undefined =>
  profile.history[0]

export const selectGenreWeights = (profile: LocalProfile): number[] => {
  const weights = new Map<number, number>()
  const now = Date.now()

  for (const item of profile.history) {
    const ageDays = Math.max(0, (now - item.at) / 86_400_000)
    const weight = 1 / (1 + ageDays / 14)
    for (const genre of item.genres) {
      weights.set(genre, (weights.get(genre) ?? 0) + weight)
    }
  }

  return Array.from(weights.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([genre]) => genre)
}

export const selectLanguages = (profile: LocalProfile): string[] => {
  const languages = new Set<string>()
  for (const item of profile.history) {
    if (item.language === 'hi' || item.language === 'en') languages.add(item.language)
    if (languages.size === 2) break
  }
  return Array.from(languages)
}

export const selectExcludes = (profile: LocalProfile): number[] => {
  const ids = new Set<number>()
  for (const item of profile.history) ids.add(item.id)
  for (const like of profile.likes) ids.add(like.id)
  return Array.from(ids).slice(0, 60)
}
