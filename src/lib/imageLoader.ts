const TMDB_BASE = 'https://image.tmdb.org/t/p/'
const TMDB_WIDTHS = [92, 154, 185, 342, 500, 780, 1280] as const

interface LoaderArgs {
  src: string
  width: number
  quality?: number
}

// Bypasses Vercel's image optimizer (quota-limited) and requests an
// appropriate TMDB size directly. Local assets are already optimized WebP.
export default function imageLoader({ src, width }: LoaderArgs) {
  if (!src.startsWith('http')) return src

  if (src.startsWith(TMDB_BASE)) {
    const rest = src.slice(TMDB_BASE.length)
    const slash = rest.indexOf('/')
    if (slash >= 0) {
      const path = rest.slice(slash + 1)
      const size = TMDB_WIDTHS.find((candidate) => candidate >= width) ?? 1280
      return `${TMDB_BASE}w${size}/${path}`
    }
  }

  return src
}
