import { getTVDetails, getImageUrl } from '@/lib/tmdb'
import VideoPlayer from '@/components/VideoPlayer'
import { Star, Clock, Calendar, Users, Tv } from 'lucide-react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import SeasonSelector from './SeasonSelector'

export default async function TVPage({ params }: { params: { id: string } }) {
  try {
    const show = await getTVDetails(params.id)

    if (!show) {
      notFound()
    }
    
    if (show.success === false || show.status_code === 34) {
      notFound()
    }

    const cast = show.credits?.cast?.slice(0, 6) || []
    const similar = show.similar?.results?.slice(0, 6) || []

    return (
    <main className="min-h-screen bg-background pt-20 pb-32">
      {/* Backdrop */}
      {show.backdrop_path && (
        <div className="absolute top-0 left-0 w-full h-[50vh] md:h-[70vh] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background z-10" />
          <Image
            src={getImageUrl(show.backdrop_path, 'original')}
            alt={show.name}
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
            {show.poster_path && (
              <div className="relative w-48 sm:w-56 md:w-full aspect-[2/3]">
                <Image
                  src={getImageUrl(show.poster_path)}
                  alt={show.name}
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
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-3">{show.name}</h1>
              {show.original_name !== show.name && (
                <p className="text-xl md:text-2xl text-white/60">{show.original_name}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-primary text-primary" />
                <span className="font-bold">{show.vote_average.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-white/60" />
                <span>{new Date(show.first_air_date).getFullYear()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Tv className="w-5 h-5 text-white/60" />
                <span>{show.number_of_seasons} Season{show.number_of_seasons > 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {show.genres?.map((genre: any) => (
                <span
                  key={genre.id}
                  className="px-3 py-1 bg-white/10 rounded-full text-sm backdrop-blur-sm"
                >
                  {genre.name}
                </span>
              ))}
            </div>

            <p className="text-white/80 leading-relaxed text-sm md:text-base">{show.overview}</p>

            {/* Cast */}
            {cast.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-primary" />
                  <h3 className="font-display text-lg md:text-xl font-bold">Cast / कलाकार</h3>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                  {cast.map((person: any) => (
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

        {/* Season & Episode Selector + Video Player */}
        <SeasonSelector 
          tmdbId={params.id}
          seasons={show.seasons || []}
          showTitle={show.name}
        />

        {/* Similar Shows */}
        {similar.length > 0 && (
          <div className="mt-16">
            <h3 className="font-display text-3xl font-bold mb-8">Similar Shows / समान शो</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {similar.map((s: any) => (
                <Link key={s.id} href={`/tv/${s.id}`}>
                  <div className="group cursor-pointer">
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 bg-white/5">
                      <Image
                        src={getImageUrl(s.poster_path)}
                        alt={s.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/80 px-2 py-1 rounded">
                        <Star className="w-3 h-3 fill-primary text-primary" />
                        <span className="text-xs font-bold">{s.vote_average.toFixed(1)}</span>
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
  } catch (error) {
    notFound()
  }
}
