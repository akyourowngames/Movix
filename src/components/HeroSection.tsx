'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Play, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export interface HeroMovie {
  id: number
  title: string
  original_title?: string
  backdrop_path: string | null
  overview: string
  media_type?: 'movie' | 'tv'
}

interface HeroSectionProps {
  movies: HeroMovie[]
}

const backdropUrl = (path: string | null) =>
  path ? `https://image.tmdb.org/t/p/w1280${path}` : ''

export default function HeroSection({ movies }: HeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const prefersReducedMotion = useReducedMotion()
  const [pageVisible, setPageVisible] = useState(true)

  const currentMovie = movies[currentIndex]

  useEffect(() => {
    const updateVisibility = () => setPageVisible(document.visibilityState === 'visible')
    updateVisibility()
    document.addEventListener('visibilitychange', updateVisibility)
    return () => document.removeEventListener('visibilitychange', updateVisibility)
  }, [])

  useEffect(() => {
    if (movies.length <= 1 || prefersReducedMotion || !pageVisible) return
    const timer = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % movies.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [movies.length, prefersReducedMotion, pageVisible])

  useEffect(() => {
    if (movies.length <= 1) return
    const next = movies[(currentIndex + 1) % movies.length]
    if (!next?.backdrop_path) return
    const img = new window.Image()
    img.src = backdropUrl(next.backdrop_path)
  }, [currentIndex, movies])

  if (!currentMovie) return null

  const handleNext = () => {
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % movies.length)
  }

  const handlePrev = () => {
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length)
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  }

  return (
    <section className="relative flex min-h-[540px] w-full items-center overflow-hidden pb-16 pt-28 sm:min-h-[600px] md:min-h-[660px] md:pt-32">
      {/* Animated Background Images */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={prefersReducedMotion ? { duration: 0 } : {
            x: { type: 'tween', duration: 0.35, ease: 'easeOut' },
            opacity: { duration: 0.35 },
          }}
          className="absolute inset-0 z-0"
        >
          {currentMovie.backdrop_path && (
            <Image
              src={backdropUrl(currentMovie.backdrop_path)}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Overlays */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-background via-background/85 to-background/25" />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-background via-transparent to-black/20" />
      <div className="absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-background to-transparent" />

      {/* Carousel controls */}
      <div className="absolute bottom-5 right-4 z-30 flex items-center gap-2 sm:right-6 md:right-10">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous featured title"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next featured title"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div
          className="ml-1 flex items-center gap-1.5"
          role="group"
          aria-label="Choose featured title"
        >
          {movies.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                setDirection(index > currentIndex ? 1 : -1)
                setCurrentIndex(index)
              }}
              aria-label={`Show featured title ${index + 1}: ${movies[index].title}`}
              aria-current={index === currentIndex ? 'true' : undefined}
              className="flex h-8 w-8 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span
                aria-hidden="true"
                className={`h-1 rounded-full transition-all motion-reduce:transition-none ${
                  index === currentIndex ? 'w-7 bg-primary' : 'w-2.5 bg-white/45'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="page-shell relative z-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -30 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
            className="max-w-xl md:max-w-[600px]"
          >
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.8, delay: prefersReducedMotion ? 0 : 0.2 }}
              className="mb-4 inline-flex items-center border-l-2 border-primary py-1 pl-3"
            >
              <span className="eyebrow text-primary">
                {currentMovie.media_type === 'tv' ? 'Series Premiere' : 'Exclusive Premiere'}
              </span>
            </motion.div>

            {/* Movie Title - Shows original Hindi title */}
            <h1 className="relative z-20 mb-4 font-display text-[clamp(2.4rem,5.5vw,5.25rem)] font-semibold leading-[0.98] tracking-tight text-white">
              <span>
                {currentMovie.original_title || currentMovie.title}
              </span>
            </h1>

            <p className="mb-7 line-clamp-3 max-w-[540px] text-sm leading-7 text-white/80 sm:text-base">
              {currentMovie.overview || 'The best of cinema, all in one place.'}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3">
              <div>
                <Link
                  href={currentMovie.media_type === 'tv' ? `/tv/${currentMovie.id}` : `/movie/${currentMovie.id}`}
                  className="flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-background transition-colors hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Play className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" />
                  Watch Now
                </Link>
              </div>

              <motion.button
                type="button"
                className="flex min-h-12 items-center gap-2 rounded-full border border-white/30 bg-black/25 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Plus className="w-3 h-3 md:w-4 md:h-4" />
                Free Trial
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
