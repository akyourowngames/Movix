'use client'

import { useRouter } from 'next/navigation'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function GenreError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter()

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-background px-6 py-24">
      <div role="alert" className="w-full max-w-md text-center">
        <AlertCircle className="mx-auto mb-5 h-12 w-12 text-amber-300" aria-hidden="true" />
        <h1 className="mb-3 font-display text-2xl font-bold">Titles unavailable</h1>
        <p className="mb-7 text-sm text-muted-foreground">We couldn&apos;t load this category right now. Try again or browse other titles.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Retry
          </button>
          <button type="button" onClick={() => router.push('/browse')} className="min-h-11 rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Browse titles</button>
        </div>
      </div>
    </main>
  )
}
