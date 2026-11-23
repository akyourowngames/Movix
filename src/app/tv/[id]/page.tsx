import type { Metadata } from 'next'
import { getTVDetails } from '@/lib/tmdb'
import { getAnimeSeasons } from '@/lib/animeSeasons'
import { getImageUrl } from '@/lib/catalog'
import { Star, Calendar, Users, Tv, Play } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import SeasonSelector from './SeasonSelector'
import TrailerButton from '@/components/TrailerButton'
import TrackView from '@/components/TrackView'
import { SITE_NAME, SITE_URL, absoluteUrl, serializeJsonLd } from '@/lib/site'
import {
  pickTrailers,
  pickPrimaryTrailer,
  trailerEmbedUrl,
  trailerThumbnail,
} from '@/lib/trailers'

const trimDescription = (text: string | undefined, fallback: string) => {
  const clean = (text || fallback).replace(/\s+/g, ' ').trim()
  if (clean.length <= 158) return clean
  return `${clean.slice(0, 155).replace(/\s+\S*$/, '')}…`
}

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const show = await getTVDetails(params.id)

  if (!show || show.success === false || show.status_code === 34) {
    return {
      title: 'Title not found',
      robots: { index: false, follow: false },
    }
  }

  const year =
    typeof show.first_air_date === 'string' ? show.first_air_date.slice(0, 4) : ''
  const title = `${show.name}${year ? ` (${year})` : ''} — Seasons, Cast & Streaming`
  const description = trimDescription(
    show.overview,
    `Episode guide, cast, ratings and streaming options for ${show.name} on ${SITE_NAME}.`
  )
  const image = show.backdrop_path
    ? getImageUrl(show.backdrop_path, 'w1280')
    : show.poster_path
      ? getImageUrl(show.poster_path, 'w500')
      : undefined
  const genres = (show.genres || []).map((genre: { name: string }) => genre.name)

  return {
    title,
    description,
    keywords: [show.name, ...genres, 'web series', 'watch online', SITE_NAME].filter(Boolean),
    alternates: { canonical: `/tv/${params.id}` },
    openGraph: {
      type: 'video.tv_show',
      title,
      description,
      url: `/tv/${params.id}`,
      siteName: SITE_NAME,
      images: image ? [{ url: image, alt: `${show.name} artwork` }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function TVPage({ params }: { params: { id: string } }) {
    const show = await getTVDetails(params.id)

    const cast = show.credits?.cast?.slice(0, 6) || []
    const similar = show.similar?.results?.slice(0, 6) || []
    const trailers = pickTrailers(show.videos)
    const primaryTrailer = pickPrimaryTrailer(trailers, 'en')

    interface Genre {
      id: number
      name: string
    }

    interface CastMember {
      id: number
      name: string
      character: string
      profile_path: string | null
    }

    interface SimilarShow {
      id: number
      name: string
      poster_path: string | null
      vote_average: number
    }

    const firstAirDate = show.first_air_date ? new Date(show.first_air_date) : null
    const firstAirYear = firstAirDate && Number.isFinite(firstAirDate.getTime())
      ? firstAirDate.getFullYear()
      : null

    const genres = show.genres || []
    const isAnime = show.original_language === 'ja' && genres.some((genre: Genre) => genre.id === 16)
    const seasonsForUi = await getAnimeSeasons(show, isAnime)
    const poster = show.poster_path ? getImageUrl(show.poster_path, 'w500') : undefined
    const backdrop = show.backdrop_path ? getImageUrl(show.backdrop_path, 'w1280') : undefined

    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'TVSeries',
          name: show.name,
          alternateName:
            show.original_name && show.original_name !== show.name
              ? show.original_name
              : undefined,
          description: show.overview || undefined,
          image: [backdrop, poster].filter((value): value is string => Boolean(value)),
          datePublished: show.first_air_date || undefined,
          genre: genres.map((genre: Genre) => genre.name),
          inLanguage: show.original_language || undefined,
          numberOfSeasons: seasonsForUi.length || undefined,
          numberOfEpisodes: show.number_of_episodes || undefined,
          url: absoluteUrl(`/tv/${show.id}`),
          sameAs: [`https://www.themoviedb.org/tv/${show.id}`],
          actor: cast.map((person: CastMember) => ({
            '@type': 'Person',
            name: person.name,
          })),
          aggregateRating:
            show.vote_count > 0
              ? {
                  '@type': 'AggregateRating',
                  ratingValue: Number(show.vote_average.toFixed(1)),
                  ratingCount: show.vote_count,
                  bestRating: 10,
                  worstRating: 0,
                }
              : undefined,
          ...(primaryTrailer
            ? {
                trailer: {
                  '@type': 'VideoObject',
                  name: primaryTrailer.name,
                  description: `Official trailer for ${show.name}`,
                  thumbnailUrl: trailerThumbnail(primaryTrailer.key),
                  uploadDate: primaryTrailer.publishedAt || new Date().toISOString(),
                  embedUrl: trailerEmbedUrl(primaryTrailer.key, false),
                },
              }
            : {}),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Web Series',
              item: `${SITE_URL}/browse?type=tv`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: show.name,
              item: absoluteUrl(`/tv/${show.id}`),
            },
          ],
        },
      ],
    }

    return (
    <main className="min-h-screen bg-background pt-20 pb-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />
      <TrackView
        id={show.id}
        type="tv"
        title={show.name}
        poster={show.poster_path}
        genres={show.genres?.map((genre: Genre) => genre.id) || []}
        language={show.original_language}
      />
      {/* Backdrop */}
      {show.backdrop_path && (
        <div className="absolute top-0 left-0 w-full h-[50vh] md:h-[70vh] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background z-10" />
          <Image
            src={getImageUrl(show.backdrop_path, 'w1280')}
            alt={show.name}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </div>
      )}

      <div className="page-shell relative z-20 pt-28 sm:pt-32 md:pt-36">
        <div className="mb-12 grid min-w-0 gap-6 md:grid-cols-[240px_minmax(0,1fr)] md:gap-10 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Poster */}
          <div className="flex min-w-0 justify-center md:justify-start">
            <div className="relative flex aspect-[2/3] w-48 items-center justify-center overflow-hidden rounded-lg bg-white/5 sm:w-56 md:w-full">
              {show.poster_path ? (
                <Image
                  src={getImageUrl(show.poster_path)}
                  alt={`${show.name} poster`}
                  fill
                  sizes="(max-width: 640px) 192px, (max-width: 768px) 224px, (max-width: 1024px) 280px, 320px"
                  className="rounded-xl shadow-2xl object-cover"
                  priority
                />
              ) : (
                <div className="flex flex-col items-center gap-2 px-4 text-center text-muted-foreground">
                  <Tv className="h-8 w-8" aria-hidden="true" />
                  <span className="text-xs">Poster unavailable</span>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="min-w-0 space-y-6">
            <div>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-3">{show.name}</h1>
              {show.original_name !== show.name && (
              <p className="text-xl text-muted-foreground md:text-2xl">{show.original_name}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-primary text-primary" />
                <span className="font-bold">{show.vote_average.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-white/60" />
                <span>{firstAirYear ?? 'Air date unavailable'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Tv className="w-5 h-5 text-white/60" />
                <span>
                  <span className="lang-en">
                    {seasonsForUi.length} Season{seasonsForUi.length > 1 ? 's' : ''}
                  </span>
                  <span className="lang-hi">{seasonsForUi.length} सीज़न</span>
                </span>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {show.genres?.map((genre: Genre) => (
                <span
                  key={genre.id}
                  className="px-3 py-1 bg-white/10 rounded-full text-sm backdrop-blur-sm"
                >
                  {genre.name}
                </span>
              ))}
            </div>

            <p className="text-white/80 leading-relaxed text-sm md:text-base">{show.overview || 'No synopsis is available for this series yet.'}</p>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#player"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-black transition-colors hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Play className="h-4 w-4 fill-current" />
                <span className="lang-en">Watch Now</span>
                <span className="lang-hi">अभी देखें</span>
              </a>
              <TrailerButton trailers={trailers} title={show.name} />
            </div>

            {/* Cast */}
            {cast.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-primary" />
                  <h2 className="font-display text-lg md:text-xl font-bold">
                    <span className="lang-en">Cast</span>
                    <span className="lang-hi">कलाकार</span>
                  </h2>
                </div>
                <div className="w-full min-w-0 max-w-full overflow-hidden">
                  <div className="flex w-full min-w-0 max-w-full gap-4 overflow-x-auto overscroll-x-contain pb-2 px-4 md:px-0">
                  {cast.map((person: CastMember) => (
                    <div key={person.id} className="w-20 min-w-20 flex-none text-center">
                      <div className="w-20 h-20 rounded-full overflow-hidden mb-2 bg-white/5 relative">
                        {person.profile_path ? (
                          <Image
                            src={getImageUrl(person.profile_path, 'w500')}
                            alt={person.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/40">
                            <Users className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium w-20 truncate">{person.name}</p>
                      <p className="w-20 truncate text-xs text-muted-foreground">{person.character}</p>
                    </div>
                  ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Season & Episode Selector + Video Player */}
        <div id="player" className="scroll-mt-28">
          <SeasonSelector
            tmdbId={params.id}
            imdbId={show.external_ids?.imdb_id}
            seasons={seasonsForUi}
            showTitle={show.name}
            isAnime={isAnime}
          />
        </div>

        {/* Similar Shows */}
        {similar.length > 0 && (
          <div className="mt-16">
            <h3 className="font-display text-3xl font-bold mb-8">
              <span className="lang-en">Similar Shows</span>
              <span className="lang-hi">समान शो</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {similar.map((s: SimilarShow) => (
                <Link key={s.id} href={`/tv/${s.id}`}>
                  <div className="group cursor-pointer">
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 bg-white/5">
                      {s.poster_path ? (
                        <Image
                          src={getImageUrl(s.poster_path)}
                          alt={`${s.name} poster`}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <Tv className="h-8 w-8" aria-hidden="true" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/80 px-2 py-1 rounded">
                        <Star className="w-3 h-3 fill-primary text-primary" />
                        <span className="text-xs font-bold">{Number.isFinite(s.vote_average) ? s.vote_average.toFixed(1) : '—'}</span>
                      </div>
                    </div>
                    <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {s.name}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
