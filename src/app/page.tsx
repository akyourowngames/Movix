import { Fragment } from 'react'
import HeroSection from '@/components/HeroSection'
import MovieCarousel from '@/components/MovieCarousel'
import PersonalRows from '@/components/PersonalRows'
import { getHomeFeed } from '@/lib/homeFeed'

export const revalidate = 900

export default async function Home() {
  const feed = await getHomeFeed()

  return (
    <main className="min-h-screen bg-background pb-32">
      <HeroSection movies={feed.hero} />

      <div className="relative z-30 -mt-32 pt-16">
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
