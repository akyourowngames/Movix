export interface TMDBVideoResult {
  key?: string
  name?: string
  site?: string
  type?: string
  official?: boolean
  iso_639_1?: string
  published_at?: string
}

export interface TrailerOption {
  key: string
  name: string
  language: string
  type: string
  official: boolean
  publishedAt?: string
}

export const pickTrailers = (
  videos: { results?: TMDBVideoResult[] } | null | undefined,
  limit = 8
): TrailerOption[] => {
  const seen = new Set<string>()
  const options: TrailerOption[] = []

  for (const video of videos?.results || []) {
    if (video.site !== 'YouTube') continue
    if (video.type !== 'Trailer' && video.type !== 'Teaser') continue
    if (!video.key || seen.has(video.key)) continue
    seen.add(video.key)
    options.push({
      key: video.key,
      name: video.name || 'Official trailer',
      language: String(video.iso_639_1 || '').toLowerCase(),
      type: video.type,
      official: Boolean(video.official),
      publishedAt: video.published_at,
    })
  }

  return options
    .sort((a, b) => {
      if (a.official !== b.official) return a.official ? -1 : 1
      if (a.type !== b.type) return a.type === 'Trailer' ? -1 : 1
      return String(b.publishedAt || '').localeCompare(String(a.publishedAt || ''))
    })
    .slice(0, limit)
}

export const pickPrimaryTrailer = (
  trailers: TrailerOption[],
  language: string = 'en'
): TrailerOption | null =>
  trailers.find((trailer) => trailer.language === language) ||
  trailers.find((trailer) => trailer.language === 'en') ||
  trailers[0] ||
  null

export const trailerThumbnail = (key: string) =>
  `https://img.youtube.com/vi/${key}/hqdefault.jpg`

export const trailerEmbedUrl = (key: string, autoplay = true) =>
  `https://www.youtube-nocookie.com/embed/${key}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`
