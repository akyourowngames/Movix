import { getTVDetails } from '@/lib/tmdb'
import { getImageUrl } from '@/lib/catalog'
import { Star, Calendar, Users, Tv } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import SeasonSelector from './SeasonSelector'
import TrackView from '@/components/TrackView'

export default async function TVPage({ params }: { params: { id: string } }) {
    const show = await getTVDetails(params.id)

    const cast = show.credits?.cast?.slice(0, 6) || []
    const similar = show.similar?.results?.slice(0, 6) || []

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

    return (
    <main className="min-h-screen bg-background pt-20 pb-32">
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
                <span>{show.number_of_seasons} Season{show.number_of_seasons > 1 ? 's' : ''}</span>
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
        <SeasonSelector 
          tmdbId={params.id}
          imdbId={show.external_ids?.imdb_id}
          seasons={show.seasons || []}
          showTitle={show.name}
        />

        {/* Similar Shows */}
        {similar.length > 0 && (
          <div className="mt-16">
            <h3 className="font-display text-3xl font-bold mb-8">Similar Shows / समान शो</h3>
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
