'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink, Play, X } from 'lucide-react'
import { useLanguage } from '@/components/LanguageProvider'
import {
  pickPrimaryTrailer,
  trailerEmbedUrl,
  type TrailerOption,
} from '@/lib/trailers'

export default function TrailerButton({
  trailers,
  title,
}: {
  trailers: TrailerOption[]
  title: string
}) {
  const [open, setOpen] = useState(false)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const { language } = useLanguage()
  const titleId = useId()

  const selected = useMemo(
    () =>
      trailers.find((trailer) => trailer.key === selectedKey) ||
      pickPrimaryTrailer(trailers, language),
    [trailers, selectedKey, language]
  )

  const languages = useMemo(() => {
    const seen = new Set<string>()
    return trailers.filter((trailer) => {
      if (!trailer.language || seen.has(trailer.language)) return false
      seen.add(trailer.language)
      return true
    })
  }, [trailers])

  useEffect(() => {
    if (!open) return
    setSelectedKey(pickPrimaryTrailer(trailers, language)?.key || null)
  }, [open, trailers, language])

  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
      previousFocus?.focus()
    }
  }, [open])

  if (!trailers.length || !selected) return null

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-5 text-sm font-semibold text-white transition-colors hover:border-primary/50 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Play className="h-4 w-4 fill-current" />
        <span className="lang-en">Watch Trailer</span>
        <span className="lang-hi">ट्रेलर देखें</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm sm:p-6"
            onClick={() => setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
              className="w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-5">
                <div className="min-w-0">
                  <h2 id={titleId} className="truncate font-display text-base font-bold text-white sm:text-lg">
                    {title} — Trailer
                  </h2>
                  <p className="truncate text-xs text-muted-foreground">
                    {selected.name}
                    {selected.language ? ` • ${selected.language.toUpperCase()}` : ''}
                  </p>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  aria-label="Close trailer"
                  onClick={() => setOpen(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {languages.length > 1 && (
                <div className="flex flex-wrap gap-2 border-b border-white/10 px-4 py-2.5 sm:px-5">
                  {languages.map((trailer) => (
                    <button
                      key={trailer.language}
                      type="button"
                      aria-pressed={selected.language === trailer.language}
                      onClick={() => setSelectedKey(trailer.key)}
                      className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        selected.language === trailer.language
                          ? 'bg-primary text-black'
                          : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {trailer.language}
                    </button>
                  ))}
                </div>
              )}

              <div className="aspect-video w-full bg-black">
                <iframe
                  key={selected.key}
                  src={trailerEmbedUrl(selected.key)}
                  title={`${title} trailer`}
                  className="h-full w-full"
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
                <p className="text-xs text-muted-foreground">
                  Trailer provided by YouTube · privacy-enhanced player
                </p>
                <a
                  href={`https://www.youtube.com/watch?v=${selected.key}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary underline-offset-4 hover:underline"
                >
                  Open on YouTube
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
