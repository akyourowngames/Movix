import type { Metadata } from 'next'
import { getImageUrl } from '@/lib/catalog'
import { getMoviesByGenre } from '@/lib/tmdb'
import Link from 'next/link'
import { Film, Star } from 'lucide-react'
import { notFound } from 'next/navigation'
import { SITE_NAME, absoluteUrl, serializeJsonLd } from '@/lib/site'

const GENRES: Record<string, { name: string; hindi: string }> = {
  '28': { name: 'Action', hindi: 'एक्शन' },
  '18': { name: 'Drama', hindi: 'ड्रामा' },
  '35': { name: 'Comedy', hindi: 'कॉमेडी' },
  '53': { name: 'Thriller', hindi: 'थ्रिलर' },
  '10749': { name: 'Romance', hindi: 'रोमांस' },
  '27': { name: 'Horror', hindi: 'हॉरर' },
}

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const genre = GENRES[params.id]

  if (!genre) {
    return { title: 'Genre not found', robots: { index: false, follow: false } }
  }

  const title = `${genre.name} Movies — Watch Online`
  const description = `Browse the best ${genre.name.toLowerCase()} movies on ${SITE_NAME}. Ratings, posters and quick access to details and streaming options.`

  return {
    title,
    description,
    keywords: [`${genre.name} movies`, 'watch online', SITE_NAME],
    alternates: { canonical: `/genre/${params.id}` },
    openGraph: {
      title,
      description,
      url: `/genre/${params.id}`,
      siteName: SITE_NAME,
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function GenrePage({ params }: { params: { id: string } }) {
  const genre = GENRES[params.id]
  
  if (!genre) {
    notFound()
  }

  const data = await getMoviesByGenre(params.id)
  const movies = data.results || []

  interface MovieItem {
    id: number
    title: string
    poster_path: string | null
    vote_average: number
    release_date: string | null
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: `${genre.name} Movies`,
        url: absoluteUrl(`/genre/${params.id}`),
        description: `Browse ${genre.name} movies on ${SITE_NAME}.`,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: movies.length,
          itemListElement: movies.slice(0, 20).map((movie: MovieItem, index: number) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: movie.title,
            url: absoluteUrl(`/movie/${movie.id}`),
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
          {
            '@type': 'ListItem',
            position: 2,
            name: `${genre.name} movies`,
            item: absoluteUrl(`/genre/${params.id}`),
          },
        ],
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-12">
          <h1 className="font-display text-5xl font-bold mb-2">{genre.name}</h1>
          <p className="text-2xl text-muted-foreground sm:text-3xl">{genre.hindi}</p>
        </div>

        {movies.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-6 text-center" role="status">
            <Film className="mb-4 h-10 w-10 text-muted-foreground" aria-hidden="true" />
            <h2 className="mb-2 text-lg font-semibold">No titles found</h2>
            <p className="max-w-md text-sm text-muted-foreground">There are no movies available in this category right now. Try browsing other categories.</p>
            <Link href="/browse" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">Browse titles</Link>
          </div>
        ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5 lg:gap-6">
          {movies.map((movie: MovieItem) => (
            <Link key={movie.id} href={`/movie/${movie.id}`} className="min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              <div className="group cursor-pointer">
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 bg-white/5">
                  {movie.poster_path ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={getImageUrl(movie.poster_path)}
                      alt={`${movie.title} poster`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Film className="h-8 w-8" aria-hidden="true" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/80 px-2 py-1 rounded">
                    <Star className="w-3 h-3 fill-primary text-primary" />
                    <span className="text-xs font-bold">{Number.isFinite(movie.vote_average) ? movie.vote_average.toFixed(1) : '—'}</span>
                  </div>
                </div>
                <p className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {movie.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {movie.release_date && Number.isFinite(new Date(movie.release_date).getTime())
                    ? new Date(movie.release_date).getFullYear()
                    : 'Release date unavailable'}
                </p>
              </div>
            </Link>
          ))}
        </div>
        )}
      </div>
    </main>
  )
}
