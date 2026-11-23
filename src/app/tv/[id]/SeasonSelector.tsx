'use client'

import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronDown, Play } from 'lucide-react'
import VideoPlayer from '@/components/VideoPlayer'
import { useAuth } from '@/components/AuthProvider'
import { fetchPlayback } from '@/lib/cloud'

interface Season {
  id: number
  name: string
  season_number: number
  episode_count: number
  air_date: string
  poster_path: string | null
  source?: 'tmdb' | 'anilist'
  anilistId?: number
  image?: string
}

interface Episode {
  id: number
  name: string
  episode_number: number
  season_number: number
  overview: string
  still_path: string
  air_date: string
  runtime: number
  image_url?: string
}

interface SeasonSelectorProps {
  tmdbId: string
  imdbId?: string
  seasons: Season[]
  showTitle: string
  isAnime?: boolean
}

const episodeCache = new Map<string, Episode[]>()


export default function SeasonSelector({ tmdbId, imdbId, seasons, showTitle, isAnime = false }: SeasonSelectorProps) {
  // Filter out season 0 (specials) and sort
  const validSeasons = seasons
    .filter(s => s.season_number > 0)
    .sort((a, b) => a.season_number - b.season_number)

  const [selectedSeason, setSelectedSeason] = useState(validSeasons[0]?.season_number || 1)
  const [selectedEpisode, setSelectedEpisode] = useState(1)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)
  const [episodeError, setEpisodeError] = useState(false)
  const [episodeRetryKey, setEpisodeRetryKey] = useState(0)
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false)
  const [activeSeason, setActiveSeason] = useState(validSeasons[0]?.season_number || 1)
  const [showEpisodeList, setShowEpisodeList] = useState(false)
  const resumeBySeason = useRef(new Map<number, number>())
  const resumeResolved = useRef(false)
  const seasonPickerRef = useRef<HTMLDivElement>(null)
  const seasonTriggerRef = useRef<HTMLButtonElement>(null)
  const seasonOptionRefs = useRef(new Map<number, HTMLButtonElement>())
  const typeaheadRef = useRef({ query: '', timer: null as ReturnType<typeof setTimeout> | null })
  const prefersReducedMotion = useReducedMotion()
  const { user, loading: authLoading } = useAuth()

  const selectedSeasonIndex = Math.max(
    0,
    validSeasons.findIndex((season) => season.season_number === selectedSeason)
  )

  const closeSeasonDropdown = (restoreFocus = false) => {
    setShowSeasonDropdown(false)
    if (restoreFocus) seasonTriggerRef.current?.focus()
  }

  const openSeasonDropdown = () => {
    if (validSeasons.length === 0) return
    setActiveSeason(validSeasons[selectedSeasonIndex]?.season_number ?? validSeasons[0].season_number)
    setShowSeasonDropdown(true)
  }

  const selectSeason = (seasonNumber: number) => {
    if (seasonNumber !== selectedSeason) setLoading(true)
    setSelectedSeason(seasonNumber)
    closeSeasonDropdown(true)
  }

  useLayoutEffect(() => {
    if (!showSeasonDropdown) return

    seasonOptionRefs.current.get(activeSeason)?.focus()
    seasonOptionRefs.current.get(activeSeason)?.scrollIntoView({ block: 'nearest' })

    const onPointerDown = (event: PointerEvent) => {
      if (!seasonPickerRef.current?.contains(event.target as Node)) {
        closeSeasonDropdown(true)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [showSeasonDropdown, activeSeason])

  useEffect(() => () => {
    if (typeaheadRef.current.timer) clearTimeout(typeaheadRef.current.timer)
  }, [])

  const handleSeasonListKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (validSeasons.length === 0) return
    const activeIndex = Math.max(
      0,
      validSeasons.findIndex((season) => season.season_number === activeSeason)
    )
    let nextIndex = activeIndex

    if (event.key === 'ArrowDown') nextIndex = (activeIndex + 1) % validSeasons.length
    else if (event.key === 'ArrowUp') nextIndex = (activeIndex - 1 + validSeasons.length) % validSeasons.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = validSeasons.length - 1
    else if (event.key === 'Escape') {
      event.preventDefault()
      closeSeasonDropdown(true)
      return
    } else if (event.key === 'Tab') {
      closeSeasonDropdown(true)
      return
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      selectSeason(activeSeason)
      return
    } else if (event.key.length === 1 && event.key.trim().length > 0 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault()
      typeaheadRef.current.query += event.key.toLocaleLowerCase()
      if (typeaheadRef.current.timer) clearTimeout(typeaheadRef.current.timer)
      typeaheadRef.current.timer = setTimeout(() => {
        typeaheadRef.current.query = ''
        typeaheadRef.current.timer = null
      }, 500)

      const query = typeaheadRef.current.query
      const matchOffset = validSeasons.findIndex((season, index) =>
        index > activeIndex && season.name.toLocaleLowerCase().startsWith(query)
      )
      const wrappedMatch = matchOffset >= 0 ? matchOffset : validSeasons.findIndex(
        (season) => season.name.toLocaleLowerCase().startsWith(query)
      )
      if (wrappedMatch >= 0) nextIndex = wrappedMatch
      else return
    } else {
      return
    }

    event.preventDefault()
    const nextSeason = validSeasons[nextIndex]
    if (!nextSeason) return
    setActiveSeason(nextSeason.season_number)
  }

  // Resume last episode (URL params win, then cloud playback)
  useEffect(() => {
    if (resumeResolved.current) return

    const params = new URLSearchParams(window.location.search)
    const seasonParam = Number(params.get('s'))
    const episodeParam = Number(params.get('e'))

    if (Number.isFinite(seasonParam) && seasonParam > 0) {
      resumeResolved.current = true
      resumeBySeason.current.set(seasonParam, Number.isFinite(episodeParam) && episodeParam > 0 ? episodeParam : 1)
      setSelectedSeason(seasonParam)
      if (Number.isFinite(episodeParam) && episodeParam > 0) setSelectedEpisode(episodeParam)
      return
    }

    if (authLoading) return

    if (!user) {
      resumeResolved.current = true
      return
    }

    resumeResolved.current = true
    let cancelled = false
    fetchPlayback(Number(tmdbId), 'tv')
      .then((playback) => {
        if (cancelled) return
        if (playback?.season) {
          const episode = playback.episode ?? 1
          resumeBySeason.current.set(playback.season, episode)
          setSelectedSeason(playback.season)
          setSelectedEpisode(episode)
        }
      })
      .catch(() => {
        // Resume is best-effort; start from the first episode on failure.
      })

    return () => {
      cancelled = true
    }
  }, [tmdbId, authLoading, user])

  // Fetch episodes when season changes
  useEffect(() => {
    const seasonConfig = seasons.find((season) => season.season_number === selectedSeason)
    const resumeAt = resumeBySeason.current.get(selectedSeason)

    const applyEpisodes = (list: Episode[]) => {
      if (resumeAt) resumeBySeason.current.delete(selectedSeason)
      setEpisodes(list)
      const firstEpisode = list[0]?.episode_number ?? 1
      setSelectedEpisode(
        resumeAt && list.some((episode) => episode.episode_number === resumeAt)
          ? resumeAt
          : firstEpisode
      )
      setLoading(false)
    }

    if (seasonConfig?.source === 'anilist') {
      const count = seasonConfig.episode_count
      const list: Episode[] = Array.from({ length: count }, (_, index) => ({
        id: -(seasonConfig.id * 10000 + index + 1),
        name: `Episode ${index + 1}`,
        episode_number: index + 1,
        season_number: selectedSeason,
        overview: '',
        still_path: '',
        air_date: '',
        runtime: 0,
        image_url: seasonConfig.image,
      }))
      setEpisodeError(false)
      applyEpisodes(list)
      return
    }

    const key = `${tmdbId}:${selectedSeason}`
    const cached = episodeCache.get(key)
    if (cached) {
      applyEpisodes(cached)
      return
    }

    const controller = new AbortController()
    setLoading(true)

    fetch(`/api/season?tv=${tmdbId}&season=${selectedSeason}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        const results: Episode[] = data.episodes || []
        episodeCache.set(key, results)
        setEpisodeError(false)
        applyEpisodes(results)
      })
      .catch((err) => {
        if ((err as Error).name === 'AbortError') return
        setEpisodes([])
        setEpisodeError(true)
        setLoading(false)
      })

    return () => controller.abort()
  }, [tmdbId, selectedSeason, episodeRetryKey, seasons])

  const currentSeason = validSeasons.find(s => s.season_number === selectedSeason)
  const currentEpisode = episodes.find(e => e.episode_number === selectedEpisode)
  const episodeImage = (episode: Episode) =>
    episode.image_url ||
    (episode.still_path ? `https://image.tmdb.org/t/p/w500${episode.still_path}` : '') ||
    currentSeason?.image ||
    ''

  return (
    <div className="space-y-6">
      {/* Season & Episode Selectors */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Season Dropdown */}
        <div className="relative flex-1" ref={seasonPickerRef}>
          <button
            ref={seasonTriggerRef}
            type="button"
            onClick={() => showSeasonDropdown ? closeSeasonDropdown() : openSeasonDropdown()}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                if (!showSeasonDropdown) openSeasonDropdown()
              }
            }}
            aria-haspopup="listbox"
            aria-expanded={showSeasonDropdown}
            aria-controls="season-options"
            disabled={validSeasons.length === 0}
            className="flex min-h-12 w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-6 py-4 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="font-medium">
              {currentSeason?.name || `Season ${selectedSeason}`}
            </span>
            <ChevronDown className={`h-5 w-5 transition-transform motion-reduce:transition-none ${showSeasonDropdown ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showSeasonDropdown && (
            <motion.div
                id="season-options"
                role="listbox"
                aria-label="Choose a season"
                onKeyDown={handleSeasonListKeyDown}
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -10 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
                className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[min(60dvh,24rem)] overflow-y-auto overscroll-contain rounded-xl border border-white/10 bg-zinc-900 shadow-2xl"
              >
                {validSeasons.map((season) => (
                  <button
                    key={season.id}
                    ref={(element) => {
                      if (element) seasonOptionRefs.current.set(season.season_number, element)
                      else seasonOptionRefs.current.delete(season.season_number)
                    }}
                    type="button"
                    role="option"
                    aria-selected={selectedSeason === season.season_number}
                    tabIndex={activeSeason === season.season_number ? 0 : -1}
                    onMouseMove={() => setActiveSeason(season.season_number)}
                    onClick={() => selectSeason(season.season_number)}
                    className={`flex min-h-12 w-full flex-col justify-center px-6 py-3 text-left transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary motion-reduce:transition-none ${
                      selectedSeason === season.season_number ? 'bg-primary/20 text-primary' : 'text-white'
                    }`}
                  >
                    <div className="font-medium">{season.name}</div>
                    <div className="text-xs text-muted-foreground">{season.episode_count} episodes</div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Episode Toggle */}
        <button
          type="button"
          id="episode-list-trigger"
          onClick={() => setShowEpisodeList(!showEpisodeList)}
          aria-expanded={showEpisodeList}
          aria-controls="episode-list"
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 font-semibold text-black transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
        >
          <Play className="w-5 h-5" />
          Episode {selectedEpisode}
          <ChevronDown className={`h-5 w-5 transition-transform motion-reduce:transition-none ${showEpisodeList ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Episode List */}
      <AnimatePresence>
        {showEpisodeList && (
          <motion.div
            id="episode-list"
            role="region"
            aria-labelledby="episode-list-trigger"
            aria-busy={loading}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-3 py-12 text-sm text-white/60" role="status">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/10 border-t-primary" />
                Loading episodes…
              </div>
            ) : episodeError ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center" role="alert">
                <p className="text-sm text-white/70">Episodes could not be loaded. Check your connection and try again.</p>
                <button
                  type="button"
                  onClick={() => {
                    episodeCache.delete(`${tmdbId}:${selectedSeason}`)
                    setEpisodeError(false)
                    setLoading(true)
                    setEpisodes([])
                    setEpisodeRetryKey((key) => key + 1)
                  }}
                  className="min-h-11 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Retry
                </button>
              </div>
            ) : (
              episodes.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {episodes.map((episode) => (
                  <motion.button
                    key={episode.id}
                    type="button"
                    aria-pressed={selectedEpisode === episode.episode_number}
                    whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                    onClick={() => {
                      setSelectedEpisode(episode.episode_number)
                      setShowEpisodeList(false)
                    }}
                    className={`group relative min-h-11 overflow-hidden rounded-xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none ${
                      selectedEpisode === episode.episode_number
                        ? 'border-primary bg-primary/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="aspect-video bg-zinc-900 overflow-hidden">
                      {episodeImage(episode) ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={episodeImage(episode)}
                          alt={episode.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Play className="w-12 h-12" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="mb-1 text-xs text-white">Episode {episode.episode_number}</div>
                        <div className="font-medium text-sm line-clamp-1">{episode.name}</div>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-xs text-muted-foreground">{episode.overview || 'No description available'}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground" role="status">No episodes are listed for this season.</p>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Episode Info */}
      {currentEpisode && !showEpisodeList && (
        <div className="p-6 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-32 aspect-video rounded-lg overflow-hidden bg-zinc-900">
              {episodeImage(currentEpisode) ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={episodeImage(currentEpisode)}
                  alt={currentEpisode.name}
                  className="w-full h-full object-cover"
                />
              ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Play className="w-8 h-8" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="mb-1 text-xs text-muted-foreground">
                S{selectedSeason} E{selectedEpisode}
              </div>
              <h3 className="mb-2 font-semibold">{currentEpisode.name}</h3>
              <p className="line-clamp-2 text-sm text-muted-foreground">{currentEpisode.overview}</p>
            </div>
          </div>
        </div>
      )}

      {/* Video Player */}
      {loading ? (
        <div
          className="aspect-video w-full flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5"
          role="status"
          aria-live="polite"
        >
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/10 border-t-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading episodes…</p>
        </div>
      ) : episodeError ? (
        <div
          className="aspect-video w-full flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-8 text-center"
          role="alert"
        >
          <p className="text-sm text-muted-foreground">
            Episodes could not be loaded. Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => {
              episodeCache.delete(`${tmdbId}:${selectedSeason}`)
              setEpisodeError(false)
              setLoading(true)
              setEpisodes([])
              setEpisodeRetryKey((key) => key + 1)
            }}
            className="min-h-11 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Retry
          </button>
        </div>
      ) : episodes.length > 0 ? (
        <VideoPlayer
          tmdbId={tmdbId}
          imdbId={imdbId}
          type="tv"
          season={selectedSeason}
          episode={selectedEpisode}
          title={`${showTitle} - S${selectedSeason}E${selectedEpisode}`}
          isAnime={isAnime}
          seasonName={currentSeason?.name}
        />
      ) : (
        <div
          className="aspect-video w-full flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-muted-foreground"
          role="status"
        >
          No episodes are listed for this season.
        </div>
      )}
    </div>
  )
}
