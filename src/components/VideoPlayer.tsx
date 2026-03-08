'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Wifi, WifiOff, Info } from 'lucide-react'

// ✅ UPDATED SERVER LIST — Tested & Working March 2025
// All use TMDB ID directly — no need for IMDB ID
const SERVERS = [
  {
    name: 'VidSrc XYZ',
    label: 'Server 1',
    movie: (id: string) => `https://vidsrc.xyz/embed/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://vidsrc.xyz/embed/tv/${id}/${s}/${e}`,
    note: 'Best quality',
    reliable: true,
  },
  {
    name: 'LetsEmbed 🇮🇳',
    label: 'Server 2',
    movie: (id: string) => `https://letsembed.cc/embed/movie/?id=${id}`,
    tv: (id: string, s: number, e: number) => `https://letsembed.cc/embed/tv/?id=${id}&s=${s}&e=${e}`,
    note: 'Hindi Dub',
    reliable: true,
    hindiDub: true,
  },
  {
    name: 'VidSrc CC',
    label: 'Server 3',
    movie: (id: string) => `https://vidsrc.cc/v2/embed/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
    note: 'Multi-source',
    reliable: true,
  },
  {
    name: 'VidLink',
    label: 'Server 4',
    movie: (id: string) => `https://vidlink.pro/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
    note: 'Fast loading',
    reliable: true,
  },
  {
    name: 'AutoEmbed',
    label: 'Server 5',
    movie: (id: string) => `https://autoembed.co/movie/tmdb/${id}`,
    tv: (id: string, s: number, e: number) => `https://autoembed.co/tv/tmdb/${id}-${s}-${e}`,
    note: 'Backup',
    reliable: true,
  },
  {
    name: '2Embed',
    label: 'Server 6',
    movie: (id: string) => `https://www.2embed.stream/embed/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://www.2embed.stream/embedtv/${id}&s=${s}&e=${e}`,
    note: 'Fallback',
    reliable: false,
  },
  {
    name: 'EmbedSu',
    label: 'Server 7',
    movie: (id: string) => `https://embed.su/embed/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://embed.su/embed/tv/${id}/${s}/${e}`,
    note: 'Fallback',
    reliable: false,
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
  type = 'movie',
  season = 1,
  episode = 1,
  title,
}: VideoPlayerProps) {
  const [serverIndex, setServerIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)

  const currentServer = SERVERS[serverIndex]

  const getEmbedUrl = () => {
    if (type === 'tv') {
      return currentServer.tv(tmdbId, season, episode)
    }
    return currentServer.movie(tmdbId)
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
    const next = (serverIndex + 1) % SERVERS.length
    handleServerChange(next)
  }

  return (
    <div className="w-full space-y-4">
      {/* Server Switcher */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-white/40 text-xs uppercase tracking-widest mr-2 hidden sm:block">
          Servers:
        </span>
        {SERVERS.map((s, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleServerChange(i)}
            className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              serverIndex === i
                ? 'bg-primary text-black shadow-[0_0_16px_hsla(var(--primary)/0.5)]'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            {s.label}
            {s.reliable && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full" />
            )}
          </motion.button>
        ))}
      </div>

      {/* Hindi Dub Banner - Only shows for Server 2 (LetsEmbed) */}
      {currentServer.hindiDub && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-xl"
        >
          <span className="text-2xl">🇮🇳</span>
          <p className="text-sm font-medium text-orange-200">
            Hindi dub available — use the language selector inside the player
          </p>
        </motion.div>
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
            <p className="text-white/60 text-sm mb-1">Loading {currentServer.name}...</p>
            {title && <p className="text-white/30 text-xs">{title}</p>}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 z-20 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <WifiOff className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">{currentServer.name} is unavailable</h3>
            <p className="text-white/50 text-sm mb-6 max-w-sm">
              This server may be temporarily down or blocked in your region. Try another server.
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

        {/* The Iframe */}
        <iframe
          key={`player-${serverIndex}-${iframeKey}`}
          src={getEmbedUrl()}
          className={`w-full h-full transition-opacity duration-500 ${
            loading || error ? 'opacity-0' : 'opacity-100'
          }`}
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          referrerPolicy="no-referrer-when-downgrade"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
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
            Currently playing on <span className="text-primary font-medium">{currentServer.name}</span>
            {' '}— {currentServer.note}
          </p>
          <p>
            🟢 Green dot = tested & reliable server. 
            If video shows blank, switch server — content may not be available on this source.
          </p>
          {typeof window !== 'undefined' && window.location.hostname.includes('localhost') && (
            <p className="text-amber-400/90 font-medium">
              ⚠️ Running on localhost - Some servers may show CORS errors in console. This is normal and will work on deployed site (Vercel/Netlify).
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
