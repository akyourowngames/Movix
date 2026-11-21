export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://cine-hindi.vercel.app'
).replace(/\/$/, '')

export const SITE_NAME = 'CineHindi'
export const SITE_TAGLINE = 'Premium movies & web series, all in one place'
export const SITE_DESCRIPTION =
  'CineHindi is a cinematic discovery app for Bollywood, Hollywood, Indian web series, K-dramas and anime. Build a synced watchlist, track every episode and resume where you left off.'

export const AUTHOR = {
  name: 'Krish Verma',
  alternateName: 'akyourowngames',
  url: 'https://github.com/akyourowngames',
  sameAs: ['https://github.com/akyourowngames'],
  jobTitle: 'Full-stack developer',
}

export const GITHUB_REPO = 'https://github.com/akyourowngames/Movix'

export const SITE_KEYWORDS = [
  'CineHindi',
  'movie discovery',
  'watchlist app',
  'Bollywood movies',
  'Hindi movies',
  'Indian web series',
  'Hollywood movies',
  'K-dramas',
  'anime',
  'movie database',
  'streaming catalog',
]

export const absoluteUrl = (path: string) => new URL(path, SITE_URL).toString()

export const PERSON_ID = `${SITE_URL}/#person`
export const WEBSITE_ID = `${SITE_URL}/#website`

export const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: 'en-IN',
      publisher: { '@id': PERSON_ID },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Person',
      '@id': PERSON_ID,
      name: AUTHOR.name,
      alternateName: AUTHOR.alternateName,
      url: AUTHOR.url,
      sameAs: AUTHOR.sameAs,
      jobTitle: AUTHOR.jobTitle,
    },
  ],
}

export const serializeJsonLd = (value: unknown) =>
  JSON.stringify(value).replace(/</g, '\\u003c')
