'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { RefreshCw, Wifi, WifiOff, Info } from 'lucide-react'
import { recordPlayback } from '@/lib/profileActions'

interface StreamServer {
  name: string
  note: string
  banner?: string
  requiresImdb?: boolean
  mobileFriendly?: boolean
  movie: (tmdbId: string, imdbId?: string) => string
  tv: (tmdbId: string, season: number, episode: number, imdbId?: string) => string
}

const SERVERS: StreamServer[] = [
  {
    name: 'VidSrc',
    movie: (id: string) => `https://vidsrc.to/embed/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
    note: 'Hindi + English • Hollywood & Bollywood',
  },
  {
    name: 'ModiPlay',
    movie: (id: string) => `https://rozgarlelo.modiplay.xyz/embed/tmdb/movie?id=${id}`,
    tv: (id: string, s: number, e: number) =>
      `https://rozgarlelo.modiplay.xyz/embed/tmdb/tv?id=${id}&s=${s}&e=${e}`,
    note: 'Hindi • Movies & web series',
    mobileFriendly: true,
  },
  {
    name: 'AutoEmbed',
    movie: (id: string) => `https://nxsha.space/embed/movie/${id}?lang=hindi&autoplay=true`,
    tv: (id: string, s: number, e: number) => `https://nxsha.space/embed/tv/${id}/${s}/${e}?lang=hindi&autoplay=true`,
    note: 'Hindi • Hollywood & Bollywood',
    banner: '🇮🇳 Hindi audio — Hollywood & Bollywood',
  },
  {
    name: 'Hindi Exclusive',
    movie: (_id: string, imdbId?: string) => `https://slast430did.com/play/${imdbId}`,
    tv: (_id: string, _s: number, _e: number, imdbId?: string) => `https://slast430did.com/play/${imdbId}`,
    note: 'Hindi only • Exclusive',
    requiresImdb: true,
    banner: '🇮🇳 Hindi exclusive — Hindi dubbed movies & shows',
  },
  {
    name: 'CineSrc',
    movie: (id: string) => `https://cinesrc.st/embed/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://cinesrc.st/embed/tv/${id}?s=${s}&e=${e}`,
    note: 'English only',
  },
]

const AUTO_EMBED_INDEX = SERVERS.findIndex((server) => server.name === 'AutoEmbed')

interface VideoPlayerProps {
  tmdbId: string
  imdbId?: string
  type?: 'movie' | 'tv'
  season?: number
  episode?: number
  title?: string
}

export default function VideoPlayer({
  tmdbId,
  imdbId,
  type = 'movie',
  season = 1,
  episode = 1,
  title,
}: VideoPlayerProps) {
  const [serverIndex, setServerIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [frameLoaded, setFrameLoaded] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)
  const [frameIdentity, setFrameIdentity] = useState(`${tmdbId}:${type}:${season}:${episode}`)
  const [isLocalhost, setIsLocalhost] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const mobileDefaultApplied = useRef(false)
  const prefersReducedMotion = useReducedMotion()

  const currentServer = SERVERS[serverIndex]

  // Check if running on localhost (client-side only)
  useEffect(() => {
    setIsLocalhost(window.location.hostname.includes('localhost'))
  }, [])

  // Some embed providers reject mobile playback. Start phones on AutoEmbed.
  useEffect(() => {
    if (mobileDefaultApplied.current) return
    mobileDefaultApplied.current = true
    const mobile = window.matchMedia('(max-width: 767px)').matches
    setIsMobile(mobile)
    if (!mobile) return
    if (AUTO_EMBED_INDEX > 0) {
      setServerIndex(AUTO_EMBED_INDEX)
      setIframeKey((key) => key + 1)
    }
  }, [])

  const currentFrameIdentity = `${tmdbId}:${type}:${season}:${episode}`

  useEffect(() => {
    if (frameIdentity === currentFrameIdentity) return
    setFrameIdentity(currentFrameIdentity)
    setLoading(true)
    setError(false)
    setFrameLoaded(false)
  }, [currentFrameIdentity, frameIdentity])

  useEffect(() => {
    recordPlayback({
      id: Number(tmdbId),
      type,
      season: type === 'tv' ? season : null,
      episode: type === 'tv' ? episode : null,
      title: title ?? null,
    })
  }, [tmdbId, type, season, episode, title])

  const isAvailable = (server: StreamServer) =>
    !server.requiresImdb || Boolean(imdbId)

  const getEmbedUrl = () => {
    if (type === 'tv') {
      return currentServer.tv(tmdbId, season, episode, imdbId)
    }
    return currentServer.movie(tmdbId, imdbId)
  }

  const handleServerChange = (index: number) => {
    if (index === serverIndex) return
    setServerIndex(index)
    setLoading(true)
    setError(false)
    setFrameLoaded(false)
    setIframeKey(prev => prev + 1)
  }

  const handleRetry = () => {
    setLoading(true)
    setError(false)
    setFrameLoaded(false)
    setIframeKey(prev => prev + 1)
  }

  const handleNextServer = () => {
    for (let step = 1; step <= SERVERS.length; step++) {
      const next = (serverIndex + step) % SERVERS.length
      if (isAvailable(SERVERS[next])) {
        handleServerChange(next)
        return
      }
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Server Switcher */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="mr-2 hidden text-xs uppercase tracking-widest text-muted-foreground sm:block">
          Servers:
        </span>
        {SERVERS.map((s, i) => {
          if (!isAvailable(s)) return null

          return (
            <motion.button
              key={s.name}
              type="button"
              aria-pressed={serverIndex === i}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
              onClick={() => handleServerChange(i)}
              className={`relative inline-flex min-h-11 min-w-[44px] items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                serverIndex === i
                  ? 'bg-primary text-black shadow-[0_0_16px_hsla(var(--primary)/0.5)]'
                  : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {s.name}
                {isMobile && s.name === 'VidSrc' && (
                  <span
                    className={`rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                      serverIndex === i ? 'bg-black/20 text-black/70' : 'bg-white/10 text-white/50'
                    }`}
                  >
                    Desktop
                  </span>
                )}
                {isMobile && s.mobileFriendly && (
                  <span
                    className={`rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                      serverIndex === i ? 'bg-black/20 text-black/70' : 'bg-emerald-400/15 text-emerald-300'
                    }`}
                  >
                    Mobile
                  </span>
                )}
              </span>
            </motion.button>
          )
        })}
      </div>

      {/* Per-server banner */}
      {currentServer.banner && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-950/95 border border-orange-500/30 rounded-lg text-sm text-orange-200"
        >
          {currentServer.banner}
        </motion.div>
      )}

      {/* VidSrc mobile verification gate */}
      {isMobile && currentServer.name === 'VidSrc' && (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-100 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="leading-5">
            <span className="font-semibold">VidSrc is desktop-only.</span> On phones it shows a
            verification challenge inside the player, which usually blocks playback. Use AutoEmbed,
            or open VidSrc in a new tab and choose “Request desktop site”.
          </p>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (AUTO_EMBED_INDEX >= 0) handleServerChange(AUTO_EMBED_INDEX)
              }}
              className="min-h-10 rounded-lg bg-primary px-3 text-xs font-semibold text-black transition-colors hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Use AutoEmbed
            </button>
            <a
              href={getEmbedUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-10 items-center rounded-lg border border-amber-300/30 px-3 text-xs font-medium text-amber-100 transition-colors hover:bg-amber-300/10"
            >
              Open VidSrc
            </a>
          </div>
        </div>
      )}

      {frameLoaded && !error && (
        <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
          Provider page loaded. Playback availability and controls are managed by {currentServer.name}.
        </p>
      )}

      {/* Hindi TV notice */}
      {type === 'tv' && serverIndex === 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-950/95 border border-blue-500/30 rounded-lg text-xs text-blue-200">
          💡 Tip: Try AutoEmbed for Hindi TV shows
        </div>
      )}

      {/* Player */}
      <div className="relative w-full aspect-video bg-zinc-950 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
        {/* Loading State */}
        {loading && !error && (
          <div role="status" aria-live="polite" className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 z-20">
            <div className="relative mb-6">
              <div className="animate-spin rounded-full h-14 w-14 border-2 border-white/10 border-t-primary" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              </div>
            </div>
            <p className="mb-1 text-sm text-muted-foreground">
              Loading {currentServer.name}...
            </p>
            {title && <p className="text-xs text-muted-foreground">{title}</p>}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 z-20 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <WifiOff className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">{currentServer.name} unavailable</h3>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              Try another server — content may not be indexed here.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <motion.button
                type="button"
                whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                onClick={handleRetry}
                className="flex min-h-11 min-w-[44px] items-center justify-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </motion.button>
              <motion.button
                type="button"
                whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                onClick={handleNextServer}
                className="flex min-h-11 min-w-[44px] items-center justify-center gap-2 px-4 py-2 bg-primary text-black rounded-lg text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Wifi className="w-4 h-4" />
                Try Next Server
              </motion.button>
              <a
                href={getEmbedUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center justify-center rounded-lg border border-white/20 px-4 py-2 text-sm transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Open in new tab
              </a>
            </div>
          </div>
        )}

        {/* The Iframe - Render immediately */}
        <iframe
          key={`player-${serverIndex}-${iframeKey}-${frameIdentity}`}
          src={getEmbedUrl()}
          title={title ? `Video player for ${title}` : `Video player from ${currentServer.name}`}
          className={`w-full h-full transition-opacity duration-500 ${
            loading || error ? 'opacity-0' : 'opacity-100'
          }`}
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          referrerPolicy="origin"
          onLoad={() => {
            setLoading(false)
            setError(false)
            setFrameLoaded(true)
          }}
          onError={() => {
            setLoading(false)
            setError(true)
            setFrameLoaded(false)
          }}
        />
      </div>

      {/* Info Bar */}
      <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            Provider: <span className="text-primary font-medium">{currentServer.name}</span>
            {' '}— {currentServer.note}
          </p>
          <p>
            Provider availability can vary. A loaded provider page does not confirm that playback works.
          </p>
          {isMobile && (
            <p className="text-amber-200/90">
              On phones, AutoEmbed is usually the most reliable. If a server says it is
              unreachable, switch servers or open this server in a new tab.
            </p>
          )}
          <a
            href={getEmbedUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-primary underline-offset-4 hover:underline"
          >
            Open {currentServer.name} in a new tab
          </a>
          {isLocalhost && (
            <p className="text-amber-200 font-medium">
              ⚠️ Running on localhost - Some servers may show CORS errors in console. This is normal and will work on deployed site (Vercel/Netlify).
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
