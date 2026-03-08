import Link from 'next/link'
import { Film } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center">
        <Film className="w-24 h-24 text-primary mx-auto mb-6" />
        <h1 className="font-display text-6xl font-bold mb-4">404</h1>
        <p className="text-xl text-white/60 mb-8">Movie not found</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-primary text-background rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
