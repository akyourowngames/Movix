import { getImageUrl } from '@/lib/tmdb'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { notFound } from 'next/navigation'

const GENRES: Record<string, { name: string; hindi: string }> = {
  '28': { name: 'Action', hindi: 'एक्शन' },
  '18': { name: 'Drama', hindi: 'ड्रामा' },
  '35': { name: 'Comedy', hindi: 'कॉमेडी' },
  '53': { name: 'Thriller', hindi: 'थ्रिलर' },
  '10749': { name: 'Romance', hindi: 'रोमांस' },
  '27': { name: 'Horror', hindi: 'हॉरर' },
}

async function getMoviesByGenre(genreId: string) {
  const KEY = process.env.NEXT_PUBLIC_TMDB_KEY
  const res = await fetch(
    `https://api.themoviedb.org/3/discover/movie?api_key=${KEY}&with_genres=${genreId}&with_original_language=hi&sort_by=popularity.desc&page=1`
  )
  return res.json()
}

export default async function GenrePage({ params }: { params: { id: string } }) {
  const genre = GENRES[params.id]
  
  if (!genre) {
    notFound()
  }

  const data = await getMoviesByGenre(params.id)
  const movies = data.results || []

  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <div className="container mx-auto px-6">
        <div className="mb-12">
          <h1 className="font-display text-5xl font-bold mb-2">{genre.name}</h1>
          <p className="text-3xl text-white/60">{genre.hindi}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {movies.map((movie: any) => (
            <Link key={movie.id} href={`/movie/${movie.id}`}>
              <div className="group cursor-pointer">
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 bg-white/5">
                  <img
                    src={getImageUrl(movie.poster_path)}
                    alt={movie.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/80 px-2 py-1 rounded">
                    <Star className="w-3 h-3 fill-primary text-primary" />
                    <span className="text-xs font-bold">{movie.vote_average.toFixed(1)}</span>
                  </div>
                </div>
                <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {movie.title}
                </h3>
                <p className="text-xs text-white/60 mt-1">
                  {new Date(movie.release_date).getFullYear()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
