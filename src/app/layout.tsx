import type { Metadata, Viewport } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ChromeGate from '@/components/ChromeGate'
import { AuthProvider } from '@/components/AuthProvider'
import { LanguageProvider } from '@/components/LanguageProvider'
import {
  AUTHOR,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_URL,
  serializeJsonLd,
  siteJsonLd,
} from '@/lib/site'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '600', '700', '900']
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '500', '700']
})

const defaultTitle = `${SITE_NAME} — Premium Movies, Web Series & K-Dramas`
const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: defaultTitle,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: AUTHOR.name, url: AUTHOR.url }],
  creator: `${AUTHOR.name} (${AUTHOR.alternateName})`,
  publisher: SITE_NAME,
  keywords: SITE_KEYWORDS,
  category: 'entertainment',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: SITE_NAME,
    title: defaultTitle,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  verification: googleVerification ? { google: googleVerification } : undefined,
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0b0d0f',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Apply the stored language before paint to avoid a bilingual flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var l=localStorage.getItem('cinehindi:lang');if(l!=='hi'&&l!=='en')l='en';document.documentElement.dataset.lang=l;document.documentElement.lang=l==='hi'?'hi':'en';}catch(e){document.documentElement.dataset.lang='en';}})();",
          }}
        />
        <link rel="preconnect" href="https://image.tmdb.org" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
        {/* Static, locally generated JSON-LD; serializeJsonLd escapes markup. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(siteJsonLd) }}
        />
      </head>
      <body className={`${playfair.variable} ${dmSans.variable} font-sans antialiased bg-background text-foreground min-h-screen selection:bg-primary/30 selection:text-white`}>
        <LanguageProvider>
          <AuthProvider>
            <ChromeGate>
              <Navbar />
            </ChromeGate>
            {children}
            <ChromeGate>
              <Footer />
            </ChromeGate>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
