import { getMovieDetails, getImageUrl } from '@/lib/tmdb'
import VideoPlayer from '@/components/VideoPlayer'
import { Star, Clock, Calendar, Users } from 'lucide-react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default async function MoviePage({ params }: { params: { id: string } }) {
  try {
    const movie = await getMovieDetails(params.id)

    if (!movie) {
      notFound()
    }
    
    if (movie.success === false || movie.status_code === 34) {
      notFound()
    }

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
      poster_path: string
      vote_average: number
    }

    return (
    <main className="min-h-screen bg-background pt-20 pb-32">
      {/* Backdrop */}
      {movie.backdrop_path && (
        <div className="absolute top-0 left-0 w-full h-[50vh] md:h-[70vh] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background z-10" />
          <Image
            src={getImageUrl(movie.backdrop_path, 'original')}
            alt={movie.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      <div className="container mx-auto px-4 md:px-6 relative z-20 pt-32 md:pt-40 lg:pt-48">
        <div className="grid md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr] gap-6 md:gap-8 mb-12">
          {/* Poster */}
          <div className="flex justify-center md:justify-start">
            {movie.poster_path && (
              <div className="relative w-48 sm:w-56 md:w-full aspect-[2/3]">
                <Image
                  src={getImageUrl(movie.poster_path)}
                  alt={movie.title}
                  fill
                  className="rounded-xl shadow-2xl object-cover"
                  priority
                />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-3">{movie.title}</h1>
              {movie.original_title !== movie.title && (
                <p className="text-xl md:text-2xl text-white/60">{movie.original_title}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-primary text-primary" />
                <span className="font-bold">{movie.vote_average.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-white/60" />
                <span>{new Date(movie.release_date).getFullYear()}</span>
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

            <p className="text-white/80 leading-relaxed text-sm md:text-base">{movie.overview}</p>

            {/* Cast */}
            {cast.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-primary" />
                  <h3 className="font-display text-lg md:text-xl font-bold">Cast / कलाकार</h3>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                  {cast.map((person: CastMember) => (
                    <div key={person.id} className="flex-shrink-0 text-center">
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
                      <p className="text-xs text-white/40 w-20 truncate">{person.character}</p>
                    </div>
                  ))}
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
                <Link key={m.id} href={`/movie/${m.id}`}>
                  <div className="group cursor-pointer">
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 bg-white/5">
                      <Image
                        src={getImageUrl(m.poster_path)}
                        alt={m.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/80 px-2 py-1 rounded">
                        <Star className="w-3 h-3 fill-primary text-primary" />
                        <span className="text-xs font-bold">{m.vote_average.toFixed(1)}</span>
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
  } catch {
    notFound()
  }
}
