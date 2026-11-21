'use client'

import Link from 'next/link'
import { Film, Github } from 'lucide-react'
import { useLanguage } from '@/components/LanguageProvider'

const CATEGORIES = [
  { href: '/browse?category=bollywood', en: 'Bollywood', hi: 'बॉलीवुड' },
  { href: '/browse?category=indian-series', en: 'Indian Series', hi: 'भारतीय सीरीज़' },
  { href: '/browse?category=hollywood', en: 'Hollywood', hi: 'हॉलीवुड' },
  { href: '/browse?category=kdrama', en: 'K-Dramas', hi: 'के-ड्रामा' },
  { href: '/browse?category=anime', en: 'Anime', hi: 'एनीमे' },
  { href: '/browse?category=action', en: 'Action', hi: 'एक्शन' },
  { href: '/browse?category=comedy', en: 'Comedy', hi: 'कॉमेडी' },
]

export default function Footer() {
  const { language } = useLanguage()
  const l = (en: string, hi: string) => (language === 'hi' ? hi : en)

  return (
    <footer className="mt-20 border-t border-white/10 bg-[#08090c]">
      <div className="page-shell py-12 md:py-14">
        <div className="mb-10 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1.2fr_.6fr] lg:gap-12">
          {/* Brand */}
          <div>
            <h2 className="sr-only">{l('CineHindi footer', 'सिनेहिंदी फुटर')}</h2>
            <Link href="/" className="mb-4 flex items-center gap-2.5">
              <Film className="h-7 w-7 text-primary" />
              <span className="font-display text-2xl font-bold tracking-tight">CineHindi</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">सिनेमाघर</span>
            </Link>
            <p className="max-w-xs text-sm leading-6 text-muted-foreground">
              {l(
                'Your destination for Hindi cinema, series and stories.',
                'हिंदी सिनेमा, सीरीज़ और कहानियों के लिए आपका डेस्टिनेशन।'
              )}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="mb-4 text-sm font-semibold text-white">{l('Quick Links', 'क्विक लिंक्स')}</h2>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-muted-foreground hover:text-primary transition-colors">{l('Home', 'होम')}</Link></li>
              <li><Link href="/browse" className="text-muted-foreground hover:text-primary transition-colors">{l('Browse Titles', 'टाइटल ब्राउज़ करें')}</Link></li>
              <li><Link href="/search" className="text-muted-foreground hover:text-primary transition-colors">{l('Search', 'खोज')}</Link></li>
              <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">{l('About', 'परिचय')}</Link></li>
              <li><Link href="/profile" className="text-muted-foreground hover:text-primary transition-colors">{l('My Profile', 'मेरा प्रोफ़ाइल')}</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h2 className="mb-4 text-sm font-semibold text-white">{l('Categories', 'श्रेणियाँ')}</h2>
            <ul className="space-y-2 text-sm">
              {CATEGORIES.map((category) => (
                <li key={category.href}>
                  <Link href={category.href} className="text-muted-foreground hover:text-primary transition-colors">
                    {l(category.en, category.hi)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h2 className="mb-4 text-sm font-semibold text-white">{l('Connect', 'जुड़ें')}</h2>
            <div className="flex gap-4">
              <a
                href="https://github.com/akyourowngames/Movix"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={l(
                  'CineHindi source code on GitHub (opens in a new tab)',
                  'GitHub पर CineHindi सोर्स कोड (नई टैब में खुलता है)'
                )}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Github className="h-5 w-5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} CineHindi. {l('Built by', 'निर्माता')}{' '}
            <a
              href="https://github.com/akyourowngames"
              target="_blank"
              rel="me noopener noreferrer"
              className="text-white/70 underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              Krish Verma (akyourowngames)
            </a>
            .
          </p>
          <p>{l('Powered by TMDB API', 'TMDB API द्वारा संचालित')}</p>
        </div>
      </div>
    </footer>
  )
}
