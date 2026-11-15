'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Wifi, WifiOff, Info } from 'lucide-react'

interface StreamServer {
  name: string
  note: string
  reliable: boolean
  banner?: string
  requiresImdb?: boolean
  movie: (tmdbId: string, imdbId?: string) => string
  tv: (tmdbId: string, season: number, episode: number, imdbId?: string) => string
}

const SERVERS: StreamServer[] = [
  {
    name: 'VidSrc',
    movie: (id: string) => `https://vidsrc.to/embed/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
    note: 'Hindi + English • Hollywood & Bollywood',
    reliable: true,
  },
  {
    name: 'VidSrc CC',
    movie: (id: string) => `https://vidsrc.cc/v2/embed/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
    note: 'Hindi + English • Hollywood & Bollywood',
    reliable: true,
  },
  {
    name: 'AutoEmbed',
    movie: (id: string) => `https://nxsha.space/embed/movie/${id}?lang=hindi&autoplay=true`,
    tv: (id: string, s: number, e: number) => `https://nxsha.space/embed/tv/${id}/${s}/${e}?lang=hindi&autoplay=true`,
    note: 'Hindi • Hollywood & Bollywood',
    reliable: true,
    banner: '🇮🇳 Hindi audio — Hollywood & Bollywood',
  },
  {
    name: 'Hindi Exclusive',
    movie: (_id: string, imdbId?: string) => `https://slast430did.com/play/${imdbId}`,
    tv: (_id: string, _s: number, _e: number, imdbId?: string) => `https://slast430did.com/play/${imdbId}`,
    note: 'Hindi only • Exclusive',
    reliable: true,
    requiresImdb: true,
    banner: '🇮🇳 Hindi exclusive — Hindi dubbed movies & shows',
  },
  {
    name: 'SmashyStream',
    movie: (id: string) => `https://player.smashy.stream/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://player.smashy.stream/tv/${id}?s=${s}&e=${e}`,
    note: 'Wide library',
    reliable: true,
  },
  {
    name: 'CineSrc',
    movie: (id: string) => `https://cinesrc.st/embed/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://cinesrc.st/embed/tv/${id}?s=${s}&e=${e}`,
    note: 'English only',
    reliable: true,
  },
]

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
  const [iframeKey, setIframeKey] = useState(0)
  const [isLocalhost, setIsLocalhost] = useState(false)

  const currentServer = SERVERS[serverIndex]

  // Check if running on localhost (client-side only)
  useEffect(() => {
    setIsLocalhost(window.location.hostname.includes('localhost'))
  }, [])

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
    setIframeKey(prev => prev + 1)
  }

  const handleRetry = () => {
    setLoading(true)
    setError(false)
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
        <span className="text-white/40 text-xs uppercase tracking-widest mr-2 hidden sm:block">
          Servers:
        </span>
        {SERVERS.map((s, i) => {
          if (!isAvailable(s)) return null

          return (
            <motion.button
              key={s.name}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleServerChange(i)}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                serverIndex === i
                  ? 'bg-primary text-black shadow-[0_0_16px_hsla(var(--primary)/0.5)]'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <span className="flex items-center gap-1.5">{s.name}</span>
              {s.reliable && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full" />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Per-server banner */}
      {currentServer.banner && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg text-sm text-orange-300"
        >
          {currentServer.banner}
        </motion.div>
      )}

      {/* Hindi TV notice */}
      {type === 'tv' && serverIndex === 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300">
          💡 Tip: Try AutoEmbed for Hindi TV shows
        </div>
      )}

      {/* Player */}
      <div className="relative w-full aspect-video bg-zinc-950 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
        {/* Loading State */}
        {loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 z-20">
            <div className="relative mb-6">
              <div className="animate-spin rounded-full h-14 w-14 border-2 border-white/10 border-t-primary" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              </div>
            </div>
            <p className="text-white/60 text-sm mb-1">
              Loading {currentServer.name}...
            </p>
            {title && <p className="text-white/30 text-xs">{title}</p>}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 z-20 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <WifiOff className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">{currentServer.name} unavailable</h3>
            <p className="text-white/50 text-sm mb-6 max-w-sm">
              Try another server — content may not be indexed here.
            </p>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNextServer}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-lg text-sm font-semibold"
              >
                <Wifi className="w-4 h-4" />
                Try Next Server
              </motion.button>
            </div>
          </div>
        )}

        {/* The Iframe - Render immediately */}
        <iframe
          key={`player-${serverIndex}-${iframeKey}-${season}-${episode}`}
          src={getEmbedUrl()}
          className={`w-full h-full transition-opacity duration-500 ${
            loading || error ? 'opacity-0' : 'opacity-100'
          }`}
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          referrerPolicy="origin"
          onLoad={() => {
            setLoading(false)
            setError(false)
          }}
          onError={() => {
            setLoading(false)
            setError(true)
          }}
        />
      </div>

      {/* Info Bar */}
      <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-white/50 space-y-1">
          <p>
            Playing on <span className="text-primary font-medium">{currentServer.name}</span>
            {' '}— {currentServer.note}
          </p>
          <p>
            🟢 Green dot = tested & reliable. Indian TV serials work best on AutoEmbed.
          </p>
          <p className="text-amber-400/90">
            ℹ️ Note: vidsrc.xyz is blocked by Indian ISPs. VidSrc CC uses vidsrc.cc, which works in India.
          </p>
          {isLocalhost && (
            <p className="text-amber-400/90 font-medium">
              ⚠️ Running on localhost - Some servers may show CORS errors in console. This is normal and will work on deployed site (Vercel/Netlify).
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
