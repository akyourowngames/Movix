import { notFound } from 'next/navigation'
import { getTVDetails } from '@/lib/tmdb'

export default async function TVLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  const show = await getTVDetails(params.id)

  if (!show || show.success === false || show.status_code === 34) {
    notFound()
  }

  return children
}
