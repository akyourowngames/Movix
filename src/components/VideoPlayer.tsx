'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Wifi, WifiOff, Info, Zap } from 'lucide-react'
import { getHindiStream } from '@/lib/streamApi'
import HLSPlayer from './HLSPlayer'

// ✅ UPDATED SERVER LIST — 8StreamApi as primary, optimized for India
const SERVERS = [
  {
    name: '8Stream 🎯',
    label: 'Server 1',
    note: '⚡ 4K • Hindi • No Ads',
    reliable: true,
    type: 'hls' as const,
    badge: 'Best Quality',
  },
  {
    name: 'VidSrc CC',
    label: 'Server 2',
    movie: (id: string) => `https://vidsrc.cc/v2/embed/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
    note: 'Best for India ✅',
    reliable: true,
    type: 'iframe' as const,
  },
  {
    name: 'LetsEmbed 🇮🇳',
    label: 'Server 3',
    movie: (id: string) => `https://letsembed.cc/embed/movie/?id=${id}`,
    tv: (id: string, s: number, e: number) => `https://letsembed.cc/embed/tv/?id=${id}/${s}/${e}`,
    note: 'Hindi dub',
    reliable: true,
    type: 'iframe' as const,
  },
  {
    name: 'VidLink',
    label: 'Server 4',
    movie: (id: string) => `https://vidlink.pro/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
    note: 'Fast + audio switcher',
    reliable: true,
    type: 'iframe' as const,
  },
  {
    name: 'SmashyStream',
    label: 'Server 5',
    movie: (id: string) => `https://player.smashy.stream/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://player.smashy.stream/tv/${id}?s=${s}&e=${e}`,
    note: 'Wide library',
    reliable: true,
    type: 'iframe' as const,
  },
  {
    name: 'AutoEmbed',
    label: 'Server 6',
    movie: (id: string) => `https://player.autoembed.cc/embed/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`,
    note: 'Backup',
    reliable: true,
    type: 'iframe' as const,
  },
  {
    name: 'EmbedSu',
    label: 'Server 7',
    movie: (id: string) => `https://embed.su/embed/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://embed.su/embed/tv/${id}/${s}/${e}`,
    note: 'Fallback',
    reliable: false,
    type: 'iframe' as const,
  },
  {
    name: '2Embed',
    label: 'Server 8',
    movie: (id: string) => `https://www.2embed.stream/embed/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://www.2embed.stream/embed/tv/${id}/${s}/${e}`,
    note: 'Fallback',
    reliable: false,
    type: 'iframe' as const,
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
  // Skip 8Stream by default due to upstream source issues
  // Set to 0 to enable 8Stream (if you have a working deployment)
  const initialServerIndex = imdbId && false ? 0 : 1 // Disabled for now
  
  const [serverIndex, setServerIndex] = useState(initialServerIndex)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)
  const [isLocalhost, setIsLocalhost] = useState(false)
  const [hlsUrl, setHlsUrl] = useState<string | null>(null)
  const [hlsLanguage, setHlsLanguage] = useState<string>('')
  const [fetchingHls, setFetchingHls] = useState(false)

  const currentServer = SERVERS[serverIndex]

  // Fetch HLS stream when 8Stream server is selected
  useEffect(() => {
    if (currentServer.type === 'hls' && imdbId) {
      setFetchingHls(true)
      setLoading(true)
      setError(false)
      setHlsUrl(null)

      getHindiStream(imdbId)
        .then((result) => {
          if (result.success && result.url) {
            setHlsUrl(result.url)
            setHlsLanguage(result.language || 'Hindi')
            setLoading(false)
          } else {
            console.error('8Stream failed:', result.message)
            // Auto-fallback to Server 2 (VidSrc CC)
            setServerIndex(1)
          }
        })
        .catch((err) => {
          console.error('8Stream error:', err)
          // Auto-fallback to Server 2
          setServerIndex(1)
        })
        .finally(() => {
          setFetchingHls(false)
        })
    }
  }, [serverIndex, imdbId, type, currentServer.type])

  // Check if running on localhost (client-side only)
  useEffect(() => {
    setIsLocalhost(window.location.hostname.includes('localhost'))
  }, [])

  const getEmbedUrl = () => {
    if (currentServer.type === 'hls') return ''
    
    if (type === 'tv') {
      return currentServer.tv!(tmdbId, season, episode)
    }
    return currentServer.movie!(tmdbId)
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
        {SERVERS.map((s, i) => {
          // Skip 8Stream if no IMDB ID
          if (s.type === 'hls' && !imdbId) return null
          
          return (
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
              <span className="flex items-center gap-1.5">
                {s.type === 'hls' && <Zap className="w-3.5 h-3.5" />}
                {s.label}
              </span>
              {s.reliable && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full" />
              )}
              {s.badge && serverIndex !== i && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] text-primary whitespace-nowrap">
                  {s.badge}
                </span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* 8Stream Quality Banner */}
      {serverIndex === 0 && currentServer.type === 'hls' && hlsUrl && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary"
        >
          <Zap className="w-4 h-4" />
          Playing in {hlsLanguage} • Premium quality • No ads
        </motion.div>
      )}

      {/* Hindi Dub Banner — only on Server 3 (LetsEmbed) */}
      {serverIndex === 2 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg text-sm text-orange-300"
        >
          🇮🇳 Hindi dub available — use the language selector inside the player
        </motion.div>
      )}

      {/* Indian TV notice */}
      {type === 'tv' && serverIndex === 1 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300">
          💡 Tip: Try Server 3 (LetsEmbed) or Server 6 (AutoEmbed) for Indian TV shows
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
              {fetchingHls ? 'Fetching Hindi stream...' : `Loading ${currentServer.name}...`}
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

        {/* HLS Player for 8Stream */}
        {currentServer.type === 'hls' && hlsUrl && !loading && !error && (
          <HLSPlayer
            src={hlsUrl}
            title={title}
            onError={() => {
              setError(true)
              // Auto-fallback to next server
              setTimeout(() => handleNextServer(), 2000)
            }}
          />
        )}

        {/* The Iframe - Render immediately */}
        {currentServer.type === 'iframe' && (
          <iframe
            key={`player-${serverIndex}-${iframeKey}-${season}-${episode}`}
            src={getEmbedUrl()}
            className={`w-full h-full transition-opacity duration-500 ${
              loading || error ? 'opacity-0' : 'opacity-100'
            }`}
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => {
              setLoading(false)
              setError(false)
            }}
            onError={() => {
              setLoading(false)
              setError(true)
            }}
          />
        )}
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
            🟢 Green dot = tested & reliable. Indian TV serials work best on Server 3 (LetsEmbed) or Server 6 (AutoEmbed).
          </p>
          {currentServer.type === 'hls' && (
            <p className="text-primary/90">
              ⚡ Server 1 (8Stream) provides direct HLS streams with multiple audio tracks and highest quality.
            </p>
          )}
          <p className="text-amber-400/90">
            ℹ️ Note: vidsrc.xyz is blocked by Indian ISPs. We use vidsrc.cc (Server 2) which works in India.
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
