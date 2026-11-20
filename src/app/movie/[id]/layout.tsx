import { notFound } from 'next/navigation'
import { getMovieDetails } from '@/lib/tmdb'

export default async function MovieLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  const movie = await getMovieDetails(params.id)

  if (!movie || movie.success === false || movie.status_code === 34) {
    notFound()
  }

  return children
}
