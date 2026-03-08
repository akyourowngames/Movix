'use client'

import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { motion, AnimatePresence } from 'framer-motion'
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
        if (data.fatal) {
          console.error('HLS fatal error:', data)
          setError(true)
          setIsBuffering(false)
          onError?.()
        }
      })

      hlsRef.current = hls

      return () => {
        hls.destroy()
      }
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = src
      video.addEventListener('loadedmetadata', () => {
        setIsBuffering(false)
      })
    } else {
      setError(true)
      setIsBuffering(false)
    }
  }, [src, onError])

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
    if (showControls && isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [showControls, isPlaying])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const video = videoRef.current
      if (!video) return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          video.currentTime = Math.max(0, video.currentTime - 10)
          break
        case 'ArrowRight':
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
          toggleFullscreen()
          break
        case 'm':
        case 'M':
          setIsMuted((prev) => !prev)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      video.play()
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
      containerRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    if (!video) return

    const rect = e.currentTarget.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    video.currentTime = pos * video.duration
  }

  const handleQualityChange = (index: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = index
      setCurrentQuality(index)
      setShowSettings(false)
    }
  }

  const handleRetry = () => {
    setError(false)
    setIsBuffering(true)
    if (hlsRef.current) {
      hlsRef.current.loadSource(src)
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

  if (error) {
    return (
      <div className="relative w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-white font-semibold mb-2">Stream Error</h3>
        <p className="text-white/50 text-sm mb-6 max-w-sm">
          Failed to load the stream. This might be a temporary issue.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRetry}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-lg text-sm font-semibold"
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
      className="relative w-full h-full bg-black group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
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
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
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
            <div
              className="w-full h-1 bg-white/20 rounded-full mb-4 cursor-pointer group/progress"
              onClick={handleSeek}
            >
              <div
                className="h-full bg-primary rounded-full relative transition-all group-hover/progress:h-1.5"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="text-white hover:text-primary transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" fill="currentColor" />
                ) : (
                  <Play className="w-6 h-6" fill="currentColor" />
                )}
              </button>

              {/* Skip Buttons */}
              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = Math.max(0, currentTime - 10)
                  }
                }}
                className="text-white hover:text-primary transition-colors"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = Math.min(duration, currentTime + 10)
                  }
                }}
                className="text-white hover:text-primary transition-colors"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2 group/volume">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-primary transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-0 group-hover/volume:w-20 transition-all accent-primary"
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
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-white hover:text-primary transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </button>

                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full right-0 mb-2 bg-zinc-900 rounded-lg p-2 min-w-[200px]"
                    >
                      {/* Playback Speed */}
                      <div className="mb-2">
                        <p className="text-white/60 text-xs mb-1 px-2">Speed</p>
                        <div className="flex flex-wrap gap-1">
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                            <button
                              key={rate}
                              onClick={() => setPlaybackRate(rate)}
                              className={`px-3 py-1 rounded text-xs transition-colors ${
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
                          <p className="text-white/60 text-xs mb-1 px-2">Quality</p>
                          <button
                            onClick={() => handleQualityChange(-1)}
                            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
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
                              onClick={() => handleQualityChange(index)}
                              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
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
                onClick={toggleFullscreen}
                className="text-white hover:text-primary transition-colors"
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
