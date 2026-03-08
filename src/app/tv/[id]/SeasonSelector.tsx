'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Play } from 'lucide-react'
import VideoPlayer from '@/components/VideoPlayer'
import { getSeasonEpisodes } from '@/lib/tmdb'

interface Season {
  id: number
  name: string
  season_number: number
  episode_count: number
  air_date: string
  poster_path: string
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
}

interface SeasonSelectorProps {
  tmdbId: string
  seasons: Season[]
  showTitle: string
}

export default function SeasonSelector({ tmdbId, seasons, showTitle }: SeasonSelectorProps) {
  // Filter out season 0 (specials) and sort
  const validSeasons = seasons
    .filter(s => s.season_number > 0)
    .sort((a, b) => a.season_number - b.season_number)

  const [selectedSeason, setSelectedSeason] = useState(validSeasons[0]?.season_number || 1)
  const [selectedEpisode, setSelectedEpisode] = useState(1)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false)
  const [showEpisodeList, setShowEpisodeList] = useState(false)

  // Fetch episodes when season changes
  useEffect(() => {
    const fetchEpisodes = async () => {
      setLoading(true)
      try {
        const data = await getSeasonEpisodes(tmdbId, selectedSeason)
        setEpisodes(data.episodes || [])
        setSelectedEpisode(1) // Reset to first episode
      } catch (error) {
        console.error('Failed to fetch episodes:', error)
        setEpisodes([])
      }
      setLoading(false)
    }

    fetchEpisodes()
  }, [tmdbId, selectedSeason])

  const currentSeason = validSeasons.find(s => s.season_number === selectedSeason)
  const currentEpisode = episodes.find(e => e.episode_number === selectedEpisode)

  return (
    <div className="space-y-6">
      {/* Season & Episode Selectors */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Season Dropdown */}
        <div className="relative flex-1">
          <button
            onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
            className="w-full flex items-center justify-between px-6 py-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors"
          >
            <span className="font-medium">
              {currentSeason?.name || `Season ${selectedSeason}`}
            </span>
            <ChevronDown className={`w-5 h-5 transition-transform ${showSeasonDropdown ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showSeasonDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
              >
                {validSeasons.map((season) => (
                  <button
                    key={season.id}
                    onClick={() => {
                      setSelectedSeason(season.season_number)
                      setShowSeasonDropdown(false)
                    }}
                    className={`w-full px-6 py-3 text-left hover:bg-white/10 transition-colors ${
                      selectedSeason === season.season_number ? 'bg-primary/20 text-primary' : ''
                    }`}
                  >
                    <div className="font-medium">{season.name}</div>
                    <div className="text-xs text-white/40">{season.episode_count} episodes</div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Episode Toggle */}
        <button
          onClick={() => setShowEpisodeList(!showEpisodeList)}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-primary text-black font-semibold rounded-xl hover:bg-primary/90 transition-colors"
        >
          <Play className="w-5 h-5" />
          Episode {selectedEpisode}
          <ChevronDown className={`w-5 h-5 transition-transform ${showEpisodeList ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Episode List */}
      <AnimatePresence>
        {showEpisodeList && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/10 border-t-primary" />
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {episodes.map((episode) => (
                  <motion.button
                    key={episode.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedEpisode(episode.episode_number)
                      setShowEpisodeList(false)
                    }}
                    className={`group relative overflow-hidden rounded-xl border transition-all ${
                      selectedEpisode === episode.episode_number
                        ? 'border-primary bg-primary/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="aspect-video bg-zinc-900 overflow-hidden">
                      {episode.still_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w500${episode.still_path}`}
                          alt={episode.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20">
                          <Play className="w-12 h-12" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="text-xs text-white/60 mb-1">Episode {episode.episode_number}</div>
                        <div className="font-medium text-sm line-clamp-1">{episode.name}</div>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-white/50 line-clamp-2">{episode.overview || 'No description available'}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Episode Info */}
      {currentEpisode && !showEpisodeList && (
        <div className="p-6 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-32 aspect-video rounded-lg overflow-hidden bg-zinc-900">
              {currentEpisode.still_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w500${currentEpisode.still_path}`}
                  alt={currentEpisode.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20">
                  <Play className="w-8 h-8" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="text-xs text-white/40 mb-1">
                S{selectedSeason} E{selectedEpisode}
              </div>
              <h4 className="font-semibold mb-2">{currentEpisode.name}</h4>
              <p className="text-sm text-white/60 line-clamp-2">{currentEpisode.overview}</p>
            </div>
          </div>
        </div>
      )}

      {/* Video Player */}
      <VideoPlayer
        tmdbId={tmdbId}
        type="tv"
        season={selectedSeason}
        episode={selectedEpisode}
        title={`${showTitle} - S${selectedSeason}E${selectedEpisode}`}
      />
    </div>
  )
}
