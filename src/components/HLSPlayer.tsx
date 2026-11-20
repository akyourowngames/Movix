'use client'

import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  SkipForward,
  SkipBack,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

interface HLSPlayerProps {
  src: string
  title?: string
  onError?: () => void
}

export default function HLSPlayer({ src, title, onError }: HLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()
  const onErrorRef = useRef(onError)
  const recoveryRef = useRef({ network: 0, media: 0 })
  const settingsButtonRef = useRef<HTMLButtonElement>(null)
  const settingsPanelRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isBuffering, setIsBuffering] = useState(true)
  const [error, setError] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSettings, setShowSettings] = useState(false)
  const [qualities, setQualities] = useState<number[]>([])
  const [currentQuality, setCurrentQuality] = useState(-1)

  // Initialize HLS
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let nativeSource = false
    let active = true
    const handleNativeLoadedMetadata = () => {
      if (active) setIsBuffering(false)
    }
    const handleNativeError = () => {
      if (!active) return
      setError(true)
      setIsBuffering(false)
      onErrorRef.current?.()
    }

    setError(false)
    setIsBuffering(true)
    setCurrentTime(0)
    setDuration(0)
    setIsPlaying(false)
    setQualities([])
    setCurrentQuality(-1)
    recoveryRef.current = { network: 0, media: 0 }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      })

      hls.loadSource(src)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setIsBuffering(false)
        setQualities(data.levels.map((level) => level.height))
        setCurrentQuality(-1) // Auto quality
      })

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (!active || !data.fatal) return

        if (data.type === Hls.ErrorTypes.NETWORK_ERROR && recoveryRef.current.network < 1) {
          recoveryRef.current.network += 1
          hls.startLoad()
          return
        }

        if (data.type === Hls.ErrorTypes.MEDIA_ERROR && recoveryRef.current.media < 1) {
          recoveryRef.current.media += 1
          hls.recoverMediaError()
          return
        }

        setError(true)
        setIsBuffering(false)
        onErrorRef.current?.()
      })

      hlsRef.current = hls

      return () => {
        active = false
        if (hlsRef.current === hls) hlsRef.current = null
        hls.destroy()
      }
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      nativeSource = true
      video.addEventListener('loadedmetadata', handleNativeLoadedMetadata)
      video.addEventListener('error', handleNativeError)
      try {
        video.src = src
        video.load()
      } catch {
        handleNativeError()
      }
    } else {
      setError(true)
      setIsBuffering(false)
    }

    return () => {
      active = false
      if (nativeSource) {
        video.removeEventListener('loadedmetadata', handleNativeLoadedMetadata)
        video.removeEventListener('error', handleNativeError)
        video.pause()
        video.removeAttribute('src')
        video.load()
      }
    }
  }, [src])

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleDurationChange = () => setDuration(video.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleWaiting = () => setIsBuffering(true)
    const handleCanPlay = () => setIsBuffering(false)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('canplay', handleCanPlay)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('canplay', handleCanPlay)
    }
  }, [])

  // Auto-hide controls
  useEffect(() => {
    const settingsHasFocus = Boolean(
      settingsPanelRef.current?.contains(document.activeElement)
    )

    if (showControls && isPlaying && !showSettings && !settingsHasFocus) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [showControls, isPlaying, showSettings])

  // Do not hide or unmount player controls while keyboard focus is inside them.
  useEffect(() => {
    if (!isPlaying || typeof document === 'undefined') return

    const handleFocusIn = (event: FocusEvent) => {
      if (containerRef.current?.contains(event.target as Node)) {
        setShowControls(true)
      }
    }

    document.addEventListener('focusin', handleFocusIn)
    return () => document.removeEventListener('focusin', handleFocusIn)
  }, [isPlaying])

  // Keyboard shortcuts are scoped to the player so page inputs and other controls keep their keys.
  const handlePlayerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      const video = videoRef.current
      const target = e.target as HTMLElement
      if (!video || target.closest('input, textarea, select, [contenteditable="true"], button')) return
      if (target !== e.currentTarget && target !== video) return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          video.currentTime = Math.max(0, video.currentTime - 10)
          break
        case 'ArrowRight':
          e.preventDefault()
          video.currentTime = Math.min(video.duration, video.currentTime + 10)
          break
        case 'ArrowUp':
          e.preventDefault()
          setVolume((v) => Math.min(1, v + 0.1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setVolume((v) => Math.max(0, v - 0.1))
          break
        case 'f':
        case 'F':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'm':
        case 'M':
          e.preventDefault()
          setIsMuted((prev) => !prev)
          break
      }
  }

  // Update video volume
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume
    }
  }, [volume])

  // Update video muted state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted
    }
  }, [isMuted])

  // Update playback rate
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate
    }
  }, [playbackRate])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      void video.play().catch(() => {
        setError(true)
        setIsBuffering(false)
        onErrorRef.current?.()
      })
    } else {
      video.pause()
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      void containerRef.current.requestFullscreen().catch(() => {
        // Fullscreen can be denied by browser policy; keep playback usable.
      })
    } else {
      void document.exitFullscreen().catch(() => {
        // Fullscreen can be denied by browser policy; keep playback usable.
      })
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    if (!video) return

    const rect = e.currentTarget.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    video.currentTime = pos * video.duration
  }

  const handleSeekByKeyboard = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    const nextTime = Number(e.currentTarget.value)
    if (!video || !Number.isFinite(video.duration) || !Number.isFinite(nextTime)) return
    video.currentTime = Math.max(0, Math.min(video.duration, nextTime))
  }

  const handleQualityChange = (index: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = index
      setCurrentQuality(index)
      setShowSettings(false)
      settingsButtonRef.current?.focus()
    }
  }

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate)
    setShowSettings(false)
    settingsButtonRef.current?.focus()
  }

  useEffect(() => {
    if (showSettings) {
      settingsPanelRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    }
  }, [showSettings])

  const handleSettingsKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      setShowSettings(false)
      settingsButtonRef.current?.focus()
    }
  }

  const handleRetry = () => {
    setError(false)
    setIsBuffering(true)
    setCurrentTime(0)
    setDuration(0)
    recoveryRef.current = { network: 0, media: 0 }
    if (hlsRef.current) {
      const video = videoRef.current
      video?.pause()
      if (video) {
        video.currentTime = 0
      }
      hlsRef.current.stopLoad()
      hlsRef.current.loadSource(src)
      hlsRef.current.startLoad()
    } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
      const video = videoRef.current
      if (video) {
        video.pause()
        video.currentTime = 0
        try {
          video.src = src
          video.load()
        } catch {
          setError(true)
          setIsBuffering(false)
          onErrorRef.current?.()
        }
      }
    }
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleMouseMove = () => {
    setShowControls(true)
  }

  const handlePlayerSurfaceClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      event.currentTarget.focus()
      togglePlay()
    }
  }

  if (error) {
    return (
      <div role="alert" className="relative w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-white font-semibold mb-2">Stream Error</h3>
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          Failed to load the stream. This might be a temporary issue.
        </p>
        <motion.button
          type="button"
          whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
          onClick={handleRetry}
          className="flex min-h-11 min-w-[44px] items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </motion.button>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      aria-label={title ? `Video player: ${title}` : 'Video player'}
      onKeyDown={handlePlayerKeyDown}
      className="relative w-full h-full bg-black group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onClick={handlePlayerSurfaceClick}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        tabIndex={-1}
        aria-hidden="true"
        playsInline
      />

      {/* Buffering Spinner */}
      <AnimatePresence>
        {isBuffering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center Play Button */}
      <AnimatePresence>
        {!isPlaying && !isBuffering && showControls && (
          <motion.button
            type="button"
            aria-label="Play video"
            whileHover={prefersReducedMotion ? undefined : { scale: 1 }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, transition: { duration: prefersReducedMotion ? 0 : 0.2 } }}
            exit={{ scale: prefersReducedMotion ? 1 : 0.8, opacity: 0, transition: { duration: prefersReducedMotion ? 0 : 0.2 } }}
            onClick={(e) => {
              e.stopPropagation()
              togglePlay()
            }}
            className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center hover:bg-primary transition-colors"
          >
            <Play className="w-10 h-10 text-black ml-1" fill="currentColor" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 pt-20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Progress Bar */}
            <div className="relative mb-4">
              <div
                className="w-full h-1 bg-white/20 rounded-full cursor-pointer group/progress"
                onClick={handleSeek}
                aria-hidden="true"
              >
                <div
                  className="h-full bg-primary rounded-full relative transition-all group-hover/progress:h-1.5"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
                </div>
              </div>
              <input
                type="range"
                aria-label="Seek video"
                min={0}
                max={Number.isFinite(duration) ? duration : 0}
                step={1}
                value={Number.isFinite(currentTime) ? Math.min(currentTime, Number.isFinite(duration) ? duration : 0) : 0}
                onChange={handleSeekByKeyboard}
                disabled={!Number.isFinite(duration) || duration <= 0}
                className="absolute inset-x-0 -top-3 h-7 w-full cursor-pointer opacity-0 focus-visible:opacity-100 focus-visible:accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex items-center gap-4">
              {/* Play/Pause */}
              <button
                type="button"
                aria-label={isPlaying ? 'Pause video' : 'Play video'}
                onClick={togglePlay}
                className="flex min-h-11 min-w-11 items-center justify-center rounded text-white hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" fill="currentColor" />
                ) : (
                  <Play className="w-6 h-6" fill="currentColor" />
                )}
              </button>

              {/* Skip Buttons */}
              <button
                type="button"
                aria-label="Seek backward 10 seconds"
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = Math.max(0, currentTime - 10)
                  }
                }}
                className="flex min-h-11 min-w-11 items-center justify-center rounded text-white hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                type="button"
                aria-label="Seek forward 10 seconds"
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = Math.min(duration, currentTime + 10)
                  }
                }}
                className="flex min-h-11 min-w-11 items-center justify-center rounded text-white hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2 group/volume">
                <button
                  type="button"
                  aria-label={isMuted || volume === 0 ? 'Unmute video' : 'Mute video'}
                  aria-pressed={isMuted || volume === 0}
                  onClick={toggleMute}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded text-white hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                <input
                  type="range"
                  aria-label="Volume"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-0 group-hover/volume:w-20 focus-visible:w-20 transition-all accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                />
              </div>

              {/* Time */}
              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              <div className="flex-1" />

              {/* Settings */}
              <div className="relative">
                <button
                  ref={settingsButtonRef}
                  type="button"
                  aria-label="Playback settings"
                  aria-expanded={showSettings}
                  aria-controls="hls-player-settings"
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded text-white hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
                >
                  <Settings className="w-5 h-5" />
                </button>

                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      ref={settingsPanelRef}
                      id="hls-player-settings"
                      role="group"
                      aria-label="Playback settings"
                      onKeyDown={handleSettingsKeyDown}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full right-0 z-40 mb-2 max-h-[70dvh] min-w-[200px] overflow-y-auto overscroll-contain rounded-lg border border-white/10 bg-zinc-900 p-2 shadow-xl"
                    >
                      {/* Playback Speed */}
                      <div className="mb-2">
                        <p className="mb-1 px-2 text-xs text-muted-foreground">Speed</p>
                        <div className="flex flex-wrap gap-1">
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                            <button
                              key={rate}
                              type="button"
                              aria-pressed={playbackRate === rate}
                              onClick={() => handlePlaybackRateChange(rate)}
                              className={`min-h-11 min-w-11 px-3 py-1 rounded text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none ${
                                playbackRate === rate
                                  ? 'bg-primary text-black'
                                  : 'bg-white/10 text-white hover:bg-white/20'
                              }`}
                              >
                              {rate}x
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Quality */}
                      {qualities.length > 0 && (
                        <div>
                          <p className="mb-1 px-2 text-xs text-muted-foreground">Quality</p>
                          <button
                            type="button"
                            aria-pressed={currentQuality === -1}
                            onClick={() => handleQualityChange(-1)}
                            className={`min-h-11 w-full text-left px-3 py-2 rounded text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary motion-reduce:transition-none ${
                              currentQuality === -1
                                ? 'bg-primary text-black'
                                : 'text-white hover:bg-white/10'
                            }`}
                          >
                            Auto
                          </button>
                          {qualities.map((quality, index) => (
                            <button
                              key={index}
                              type="button"
                              aria-pressed={currentQuality === index}
                              onClick={() => handleQualityChange(index)}
                              className={`min-h-11 w-full text-left px-3 py-2 rounded text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary motion-reduce:transition-none ${
                                currentQuality === index
                                  ? 'bg-primary text-black'
                                  : 'text-white hover:bg-white/10'
                              }`}
                            >
                              {quality}p
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Fullscreen */}
              <button
                type="button"
                aria-label="Enter fullscreen"
                onClick={toggleFullscreen}
                className="flex min-h-11 min-w-11 items-center justify-center rounded text-white hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>

            {/* Title */}
            {title && (
              <div className="absolute top-4 left-4 text-white text-sm font-medium">
                {title}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
