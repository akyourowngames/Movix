'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { RefreshCw, Wifi, WifiOff, Info } from 'lucide-react'
import { recordPlayback } from '@/lib/profileActions'
import HLSPlayer from '@/components/HLSPlayer'
import { useLanguage } from '@/components/LanguageProvider'

interface StreamServer {
  name: string
  note: string
  banner?: string
  requiresImdb?: boolean
  mobileFriendly?: boolean
  kind?: 'iframe' | 'hls'
  languages: ('hi' | 'en')[]
  movie: (tmdbId: string, imdbId?: string) => string
  tv: (tmdbId: string, season: number, episode: number, imdbId?: string) => string
}

const CINEZO_QUERY =
  'autoplay=false&poster=true&chromecast=true&servericon=true&setting=true&pip=true&font=Roboto&fontcolor=6f63ff&fontsize=20&opacity=0.5&primarycolor=e8b86d&secondarycolor=0a0a12&iconcolor=ffffff'

const cinezo = (path: string) => `https://player.cinezo.live/embed/${path}?${CINEZO_QUERY}`

const SERVERS: StreamServer[] = [
  {
    name: 'VidSrc',
    movie: (id: string) => `https://vidsrc.to/embed/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
    note: 'Hindi + English • Hollywood & Bollywood',
    languages: ['hi', 'en'],
  },
  {
    name: 'ModiPlay',
    movie: (id: string) => `https://rozgarlelo.modiplay.xyz/embed/tmdb/movie?id=${id}`,
    tv: (id: string, s: number, e: number) =>
      `https://rozgarlelo.modiplay.xyz/embed/tmdb/tv?id=${id}&s=${s}&e=${e}`,
    note: 'Hindi • Movies & web series',
    mobileFriendly: true,
    languages: ['hi'],
  },
  {
    name: 'AutoEmbed',
    movie: (id: string) => `https://nxsha.space/embed/movie/${id}?lang=hindi&autoplay=true`,
    tv: (id: string, s: number, e: number) => `https://nxsha.space/embed/tv/${id}/${s}/${e}?lang=hindi&autoplay=true`,
    note: 'Hindi • Hollywood & Bollywood',
    banner: '🇮🇳 Hindi audio — Hollywood & Bollywood',
    languages: ['hi'],
  },
  {
    name: 'Hindi Exclusive',
    movie: (_id: string, imdbId?: string) => `https://slast430did.com/play/${imdbId}`,
    tv: (_id: string, _s: number, _e: number, imdbId?: string) => `https://slast430did.com/play/${imdbId}`,
    note: 'Hindi only • Exclusive',
    requiresImdb: true,
    banner: '🇮🇳 Hindi exclusive — Hindi dubbed movies & shows',
    languages: ['hi'],
  },
  {
    name: 'Cinezo',
    movie: (id: string) => cinezo(`movie/${id}`),
    tv: (id: string, s: number, e: number) => cinezo(`tv/${id}/${s}/${e}`),
    note: 'English • Movies & web series',
    languages: ['en'],
  },
  {
    name: 'CineSrc',
    movie: (id: string) => `https://cinesrc.st/embed/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://cinesrc.st/embed/tv/${id}?s=${s}&e=${e}`,
    note: 'English only',
    languages: ['en'],
  },
  {
    name: 'Tatakai Anime',
    kind: 'hls',
    movie: (id: string) =>
      `/api/tatakai?type=movie&tmdbId=${encodeURIComponent(id)}`,
    tv: (id: string, s: number, e: number) =>
      `/api/tatakai?type=tv&tmdbId=${encodeURIComponent(id)}&season=${s}&episode=${e}`,
    note: 'Anime only • HLS/MP4 • EN/HI subtitles',
    languages: ['en'],
    mobileFriendly: true,
  },
]

const AUTO_EMBED_INDEX = SERVERS.findIndex((server) => server.name === 'AutoEmbed')
const MODI_PLAY_INDEX = SERVERS.findIndex((server) => server.name === 'ModiPlay')

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
  const [vidsrcHelpDismissed, setVidsrcHelpDismissed] = useState(false)
  const [hlsSrc, setHlsSrc] = useState<string | null>(null)
  const [hlsIsHls, setHlsIsHls] = useState(true)
  const mobileDefaultApplied = useRef(false)
  const prefersReducedMotion = useReducedMotion()
  const { language } = useLanguage()

  const currentServer = SERVERS[serverIndex]
  const isHlsServer = currentServer.kind === 'hls'
  const subtitleSrc =
    isHlsServer && imdbId
      ? `/api/tatakai/subtitles?imdbId=${encodeURIComponent(imdbId)}&type=${type}&season=${season}&episode=${episode}&lang=${language}`
      : undefined
  const subtitleLabel = 'Subtitles'

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
    if (!isHlsServer) {
      setHlsSrc(null)
      return
    }

    const controller = new AbortController()
    let cancelled = false
    const resolverUrl =
      type === 'tv'
        ? currentServer.tv(tmdbId, season, episode, imdbId)
        : currentServer.movie(tmdbId, imdbId)

    setHlsSrc(null)
    setHlsIsHls(true)
    setLoading(true)
    setError(false)
    setFrameLoaded(false)

    fetch(resolverUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Stream resolver failed')
        return response.json()
      })
      .then((data) => {
        if (cancelled) return
        if (!data?.url) throw new Error('No stream returned')
        setHlsSrc(String(data.url))
        setHlsIsHls(data.isHls !== false)
        setLoading(false)
        setFrameLoaded(true)
      })
      .catch((err) => {
        if (cancelled || err?.name === 'AbortError') return
        setLoading(false)
        setError(true)
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [isHlsServer, currentServer, serverIndex, tmdbId, imdbId, type, season, episode, iframeKey])

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
    setVidsrcHelpDismissed(false)
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
                <span
                  className="flex items-center gap-0.5"
                  aria-label={`Languages: ${s.languages
                    .map((lang) => (lang === 'hi' ? 'Hindi' : 'English'))
                    .join(' and ')}`}
                >
                  {s.languages.map((lang) => (
                    <span
                      key={lang}
                      title={lang === 'hi' ? 'Hindi audio' : 'English audio'}
                      className={`rounded px-1 py-0.5 text-[9px] font-bold ${
                        serverIndex === i
                          ? 'bg-black/15 text-black/70'
                          : lang === 'hi'
                            ? 'bg-orange-400/15 text-orange-300'
                            : 'bg-sky-400/15 text-sky-300'
                      }`}
                    >
                      {lang === 'hi' ? 'HI' : 'EN'}
                    </span>
                  ))}
                </span>
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

      {/* VidSrc cookie gate explanation */}
      {currentServer.name === 'VidSrc' && !vidsrcHelpDismissed && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-xs text-amber-100"
        >
          <p className="flex items-start gap-2 font-semibold">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            VidSrc requires its own cookies
          </p>
          <p className="mt-1.5 leading-5 text-amber-100/80">
            A website cannot enable cookies for another domain. VidSrc asks for this because your
            browser is blocking third-party cookies. Click “Continue to VidSrc” inside the player;
            if it keeps asking, open VidSrc in a new tab (where cookies are first-party), or use
            AutoEmbed / ModiPlay.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={getEmbedUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-10 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-black transition-colors hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Open VidSrc in new tab
            </a>
            {AUTO_EMBED_INDEX >= 0 && (
              <button
                type="button"
                onClick={() => handleServerChange(AUTO_EMBED_INDEX)}
                className="min-h-10 rounded-lg border border-amber-300/30 px-3 text-xs font-medium text-amber-100 transition-colors hover:bg-amber-300/10"
              >
                Use AutoEmbed
              </button>
            )}
            {MODI_PLAY_INDEX >= 0 && (
              <button
                type="button"
                onClick={() => handleServerChange(MODI_PLAY_INDEX)}
                className="min-h-10 rounded-lg border border-amber-300/30 px-3 text-xs font-medium text-amber-100 transition-colors hover:bg-amber-300/10"
              >
                Use ModiPlay
              </button>
            )}
            <button
              type="button"
              onClick={() => setVidsrcHelpDismissed(true)}
              className="min-h-10 rounded-lg px-3 text-xs font-medium text-amber-100/60 transition-colors hover:text-amber-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {frameLoaded && !error && (
        <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
          {isHlsServer
            ? `Stream resolved from ${currentServer.name}. Playback is handled in-app.`
            : `Provider page loaded. Playback availability and controls are managed by ${currentServer.name}.`}
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
              {!isHlsServer && (
                <a
                  href={getEmbedUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center justify-center rounded-lg border border-white/20 px-4 py-2 text-sm transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Open in new tab
                </a>
              )}
            </div>
          </div>
        )}

        {isHlsServer ? (
          hlsSrc ? (
            <HLSPlayer
              key={`hls-${serverIndex}-${iframeKey}-${frameIdentity}`}
              src={hlsSrc}
              title={title}
              sourceType={hlsIsHls ? 'hls' : 'file'}
              subtitleSrc={subtitleSrc}
              subtitleLabel={subtitleLabel}
              subtitleLang={language}
              onError={() => {
                setLoading(false)
                setError(true)
              }}
            />
          ) : null
        ) : (
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
        )}
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
            Languages:{' '}
            {currentServer.languages
              .map((lang) => (lang === 'hi' ? 'Hindi' : 'English'))
              .join(' + ')}
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
          {!isHlsServer && (
            <a
              href={getEmbedUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex text-primary underline-offset-4 hover:underline"
            >
              Open {currentServer.name} in a new tab
            </a>
          )}
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
