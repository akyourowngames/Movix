import Link from 'next/link'
import { Film, Github } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-[#08090c]">
      <div className="page-shell py-12 md:py-14">
        <div className="mb-10 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1.2fr_.6fr] lg:gap-12">
          {/* Brand */}
          <div>
            <h2 className="sr-only">CineHindi footer</h2>
            <Link href="/" className="mb-4 flex items-center gap-2.5">
              <Film className="h-7 w-7 text-primary" />
              <span className="font-display text-2xl font-bold tracking-tight">CineHindi</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">सिनेमाघर</span>
            </Link>
            <p className="max-w-xs text-sm leading-6 text-muted-foreground">
              Your ultimate destination for Hindi cinema streaming.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="mb-4 text-sm font-semibold text-white">Quick Links</h2>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-muted-foreground hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/browse" className="text-muted-foreground hover:text-primary transition-colors">Browse Titles</Link></li>
              <li><Link href="/search" className="text-muted-foreground hover:text-primary transition-colors">Search</Link></li>
              <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">About</Link></li>
              <li><Link href="/profile" className="text-muted-foreground hover:text-primary transition-colors">My Profile</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h2 className="mb-4 text-sm font-semibold text-white">Categories</h2>
            <ul className="space-y-2 text-sm">
              <li><Link href="/browse?category=bollywood" className="text-muted-foreground hover:text-primary transition-colors">Bollywood / बॉलीवुड</Link></li>
              <li><Link href="/browse?category=indian-series" className="text-muted-foreground hover:text-primary transition-colors">Indian Series / वेब सीरीज़</Link></li>
              <li><Link href="/browse?category=hollywood" className="text-muted-foreground hover:text-primary transition-colors">Hollywood / हॉलीवुड</Link></li>
              <li><Link href="/browse?category=kdrama" className="text-muted-foreground hover:text-primary transition-colors">K-Dramas / के-ड्रामा</Link></li>
              <li><Link href="/browse?category=anime" className="text-muted-foreground hover:text-primary transition-colors">Anime / एनीमे</Link></li>
              <li><Link href="/browse?category=action" className="text-muted-foreground hover:text-primary transition-colors">Action / एक्शन</Link></li>
              <li><Link href="/browse?category=comedy" className="text-muted-foreground hover:text-primary transition-colors">Comedy / कॉमेडी</Link></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h2 className="mb-4 text-sm font-semibold text-white">Connect</h2>
            <div className="flex gap-4">
              <a
                href="https://github.com/akyourowngames/Movix"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="CineHindi source code on GitHub (opens in a new tab)"
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
            © {new Date().getFullYear()} CineHindi. Built by{' '}
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
          <p>Powered by TMDB API</p>
        </div>
      </div>
    </footer>
  )
}
