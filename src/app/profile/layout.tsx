import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { SITE_NAME } from '@/lib/site'

export const metadata: Metadata = {
  title: 'My profile',
  description: `Your private ${SITE_NAME} library, watchlist and resume points.`,
  robots: { index: false, follow: false },
  alternates: { canonical: '/profile' },
}

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return children
}
