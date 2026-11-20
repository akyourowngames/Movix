import { getMovieDetails } from '@/lib/tmdb'
import { getImageUrl } from '@/lib/catalog'
import VideoPlayer from '@/components/VideoPlayer'
import TrackView from '@/components/TrackView'
import { Star, Clock, Calendar, Users } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default async function MoviePage({ params }: { params: { id: string } }) {
  const movie = await getMovieDetails(params.id)

    const cast = movie.credits?.cast?.slice(0, 6) || []
    const similar = movie.similar?.results?.slice(0, 6) || []

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

    interface SimilarMovie {
      id: number
      title: string
      poster_path: string | null
      vote_average: number
    }

    const releaseDate = movie.release_date ? new Date(movie.release_date) : null
    const releaseYear = releaseDate && Number.isFinite(releaseDate.getTime())
      ? releaseDate.getFullYear()
      : null

  return (
    <main className="min-h-screen bg-background pt-20 pb-32">
      <TrackView
        id={movie.id}
        type="movie"
        title={movie.title}
        poster={movie.poster_path}
        genres={movie.genres?.map((genre: Genre) => genre.id) || []}
        language={movie.original_language}
      />
      {/* Backdrop */}
      {movie.backdrop_path && (
        <div className="absolute top-0 left-0 w-full h-[50vh] md:h-[70vh] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background z-10" />
          <Image
            src={getImageUrl(movie.backdrop_path, 'w1280')}
            alt={movie.title}
            fill
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
              {movie.poster_path ? (
                <Image
                  src={getImageUrl(movie.poster_path)}
                  alt={`${movie.title} poster`}
                  fill
                  className="rounded-xl object-cover shadow-2xl"
                  priority
                />
              ) : (
                <div className="flex flex-col items-center gap-2 px-4 text-center text-muted-foreground">
                  <Star className="h-8 w-8" aria-hidden="true" />
                  <span className="text-xs">Poster unavailable</span>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="min-w-0 space-y-6">
            <div>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-3">{movie.title}</h1>
              {movie.original_title !== movie.title && (
                <p className="text-xl text-muted-foreground md:text-2xl">{movie.original_title}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-primary text-primary" />
                <span className="font-bold">{Number.isFinite(movie.vote_average) ? movie.vote_average.toFixed(1) : '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-white/60" />
                <span>{releaseYear ?? 'Release date unavailable'}</span>
              </div>
              {movie.runtime && (
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-white/60" />
                  <span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              {movie.genres?.map((genre: Genre) => (
                <span
                  key={genre.id}
                  className="px-3 py-1 bg-white/10 rounded-full text-sm backdrop-blur-sm"
                >
                  {genre.name}
                </span>
              ))}
            </div>

            {movie.overview ? (
              <p className="text-white/80 leading-relaxed text-sm md:text-base">{movie.overview}</p>
            ) : (
              <p className="text-muted-foreground leading-relaxed text-sm md:text-base">No synopsis is available for this movie yet.</p>
            )}

            {/* Cast */}
            {cast.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-primary" />
                  <h2 className="font-display text-lg md:text-xl font-bold">Cast / कलाकार</h2>
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

        {/* Video Player */}
        <VideoPlayer tmdbId={params.id} imdbId={movie.external_ids?.imdb_id} type="movie" title={movie.title} />

        {/* Similar Movies */}
        {similar.length > 0 && (
          <div className="mt-16">
            <h3 className="font-display text-3xl font-bold mb-8">Similar Movies / समान फिल्में</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {similar.map((m: SimilarMovie) => (
                <Link
                  key={m.id}
                  href={`/movie/${m.id}`}
                  aria-label={`View ${m.title}`}
                  className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <div className="group cursor-pointer">
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 bg-white/5">
                      {m.poster_path ? (
                        <Image
                          src={getImageUrl(m.poster_path)}
                          alt={`${m.title} poster`}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <Star className="h-8 w-8" aria-hidden="true" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/80 px-2 py-1 rounded">
                        <Star className="w-3 h-3 fill-primary text-primary" />
                        <span className="text-xs font-bold">{Number.isFinite(m.vote_average) ? m.vote_average.toFixed(1) : '—'}</span>
                      </div>
                    </div>
                    <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {m.title}
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
