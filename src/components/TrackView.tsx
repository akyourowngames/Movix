'use client'

import { useEffect } from 'react'
import { trackView } from '@/hooks/useLocalProfile'

interface TrackViewProps {
  id: number
  type: 'movie' | 'tv'
  title: string
  poster: string | null
  genres: number[]
  language?: string
}

export default function TrackView({ id, type, title, poster, genres, language }: TrackViewProps) {
  const genreKey = genres.join(',')

  useEffect(() => {
    trackView({ id, type, title, poster, genres, language })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, type, title, poster, genreKey, language])

  return null
}
