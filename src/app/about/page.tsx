import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Database, Github, MonitorSmartphone, Sparkles } from 'lucide-react'
import {
  AUTHOR,
  GITHUB_REPO,
  SITE_DESCRIPTION,
  SITE_NAME,
  absoluteUrl,
  serializeJsonLd,
} from '@/lib/site'

const title = 'About & author'

export const metadata: Metadata = {
  title,
  description: `${SITE_NAME} is a cinematic movie and web-series discovery app built by ${AUTHOR.name} (${AUTHOR.alternateName}). Learn about the project, the stack and the author.`,
  alternates: { canonical: '/about' },
  openGraph: {
    title,
    description: `${SITE_NAME} — a cinematic discovery app by ${AUTHOR.name}.`,
    url: '/about',
    siteName: SITE_NAME,
    type: 'profile',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description: `${SITE_NAME} — a cinematic discovery app by ${AUTHOR.name}.`,
  },
}

const aboutJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: `${SITE_NAME} — About`,
  url: absoluteUrl('/about'),
  description: SITE_DESCRIPTION,
  mainEntity: {
    '@type': 'Person',
    name: AUTHOR.name,
    alternateName: AUTHOR.alternateName,
    url: AUTHOR.url,
    sameAs: AUTHOR.sameAs,
    jobTitle: AUTHOR.jobTitle,
    worksFor: { '@type': 'Organization', name: SITE_NAME },
  },
}

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Discovery first',
    body: 'Curated rows, 28 categories and personal recommendations across Bollywood, Hollywood, Indian series, K-dramas and anime.',
  },
  {
    icon: MonitorSmartphone,
    title: 'Optional accounts',
    body: 'Browse as a guest, or sign in to sync watch history, watchlists and episode-level resume points across devices.',
  },
  {
    icon: Database,
    title: 'Built on TMDB',
    body: 'Posters, backdrops, ratings and metadata come from The Movie Database. Availability can vary by provider.',
  },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background pb-28 pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(aboutJsonLd) }}
      />

      <div className="page-shell max-w-4xl">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-white/55 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to browsing
        </Link>

        <header className="mt-8 border-b border-white/10 pb-10">
          <p className="eyebrow mb-3 text-primary">About the project</p>
          <h1 className="max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            A cinema-first way to find your next story.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            {SITE_NAME} is a portfolio-grade streaming catalogue and discovery experience.
            It pairs a fast, guest-friendly browse flow with optional accounts for people who
            want their library to follow them across screens.
          </p>
        </header>

        <section aria-labelledby="features-heading" className="mt-10">
          <h2 id="features-heading" className="sr-only">
            What CineHindi does
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title: featureTitle, body }) => (
              <div
                key={featureTitle}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
              >
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <h3 className="mt-4 font-semibold text-white">{featureTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="author-heading"
          className="mt-12 rounded-2xl border border-white/10 bg-card p-6 sm:p-8"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15 font-display text-xl font-bold text-primary">
                KV
              </div>
              <div>
                <h2 id="author-heading" className="font-display text-2xl font-semibold">
                  {AUTHOR.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {AUTHOR.jobTitle} ·{' '}
                  <span className="text-white/70">{AUTHOR.alternateName}</span>
                </p>
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                  Designed and developed {SITE_NAME}. I build product-focused web apps with
                  Next.js, TypeScript and Postgres, and care about fast browsing, accessible
                  motion and interfaces that feel like the stories they present.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <a
                href={AUTHOR.url}
                target="_blank"
                rel="me noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-sm font-medium text-white/80 transition-colors hover:border-primary/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Github className="h-4 w-4" aria-hidden="true" />
                @{AUTHOR.alternateName}
              </a>
              <a
                href={GITHUB_REPO}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground underline-offset-4 hover:text-white hover:underline"
              >
                View the source
              </a>
            </div>
          </div>
        </section>

        <section className="mt-10 text-sm leading-6 text-muted-foreground">
          <h2 className="mb-3 font-semibold text-white">Tech & data</h2>
          <p>
            Built with Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion and
            Supabase for authentication and the synced library. Metadata and artwork are
            provided by TMDB; this product uses the TMDB API but is not endorsed or certified
            by TMDB.
          </p>
        </section>
      </div>
    </main>
  )
}
