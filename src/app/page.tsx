import { Fragment } from 'react'
import type { Metadata } from 'next'
import HeroSection from '@/components/HeroSection'
import MovieCarousel from '@/components/MovieCarousel'
import PersonalRows from '@/components/PersonalRows'
import { getHomeFeed } from '@/lib/homeFeed'
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/site'

const homeTitle = `${SITE_NAME} — Watch Bollywood, Hollywood & Web Series`

export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    title: homeTitle,
    description: SITE_DESCRIPTION,
    url: '/',
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: homeTitle,
    description: SITE_DESCRIPTION,
  },
}

export const dynamic = 'force-dynamic'

export default async function Home() {
  const feed = await getHomeFeed()

  return (
    <main className="min-h-screen bg-background pb-20">
      <HeroSection movies={feed.hero} />

      <div className="relative z-30 -mt-8 pt-2 md:-mt-12">
        {feed.rows.map((row, index) => (
          <Fragment key={row.key}>
            <MovieCarousel
              title={row.title}
              hindiTitle={row.hindiTitle}
              subtitle={row.subtitle}
              variant={row.variant}
              movies={row.movies}
            />
            {index === 0 && <PersonalRows kind="for-you" />}
          </Fragment>
        ))}

        <PersonalRows kind="because-watched" />
      </div>
    </main>
  )
}
