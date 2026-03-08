import Link from 'next/link'
import { Film, Github, Twitter, Instagram } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-black/50 border-t border-white/10 mt-32">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Film className="w-8 h-8 text-primary" />
              <span className="font-display text-2xl font-bold">सिनेमाघर</span>
            </Link>
            <p className="text-white/60 text-sm">
              Your ultimate destination for Hindi cinema streaming.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-white/60 hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/browse" className="text-white/60 hover:text-primary transition-colors">Browse Movies</Link></li>
              <li><Link href="/search" className="text-white/60 hover:text-primary transition-colors">Search</Link></li>
              <li><Link href="/profile" className="text-white/60 hover:text-primary transition-colors">My Profile</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-bold mb-4">Categories</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="text-white/60">Action / एक्शन</span></li>
              <li><span className="text-white/60">Drama / ड्रामा</span></li>
              <li><span className="text-white/60">Comedy / कॉमेडी</span></li>
              <li><span className="text-white/60">Romance / रोमांस</span></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-bold mb-4">Connect</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/40">
          <p>© 2024 CineHindi. All rights reserved.</p>
          <p>Powered by TMDB API</p>
        </div>
      </div>
    </footer>
  )
}
