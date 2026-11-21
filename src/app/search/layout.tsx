import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { SITE_NAME } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Search movies & web series',
  description: `Search the ${SITE_NAME} catalogue by title, genre and release year.`,
  robots: { index: false, follow: true },
  alternates: { canonical: '/search' },
}

export default function SearchLayout({ children }: { children: ReactNode }) {
  return children
}
