'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface FeaturedMovie {
  id: number
  title: string
  original_title: string
  backdrop_path: string
  overview: string
}

export default function HeroSection() {
  const [movies, setMovies] = useState<FeaturedMovie[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch trending Hindi movies from TMDB
    const fetchMovies = async () => {
      try {
        const KEY = process.env.NEXT_PUBLIC_TMDB_KEY
        const res = await fetch(
          `https://api.themoviedb.org/3/discover/movie?api_key=${KEY}&with_original_language=hi&sort_by=popularity.desc&page=1`
        )
        const data = await res.json()
        setMovies(data.results?.slice(0, 5) || [])
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch movies:', error)
        setLoading(false)
      }
    }
    fetchMovies()
  }, [])

  const currentMovie = movies[currentIndex]

  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    if (movies.length === 0) return
    const timer = setInterval(() => {
      handleNext()
    }, 5000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, movies.length])

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

  if (loading || !currentMovie) {
    return (
      <div className="relative h-screen min-h-[700px] max-h-[900px] w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="relative h-[70vh] sm:h-[80vh] md:h-[85vh] min-h-[500px] max-h-[800px] w-full flex items-center overflow-hidden">
      {/* Animated Background Images */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.5 },
          }}
          className="absolute inset-0 z-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url("https://image.tmdb.org/t/p/original${currentMovie.backdrop_path}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Overlays */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-background via-background/70 to-background/30" />
      <div className="absolute inset-x-0 bottom-0 z-10 h-32 md:h-48 bg-gradient-to-t from-background to-transparent" />

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/70 transition-all"
      >
        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/70 transition-all"
      >
        <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-1.5 md:gap-2">
        {movies.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1)
              setCurrentIndex(index)
            }}
            className={`h-1 rounded-full transition-all ${
              index === currentIndex ? 'w-6 md:w-8 bg-primary' : 'w-3 md:w-4 bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="container relative z-20 mx-auto px-4 md:px-6 max-w-7xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl md:max-w-3xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-block py-1 px-2 md:px-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-2 md:mb-4"
            >
              <span className="text-primary font-medium tracking-widest text-xs md:text-sm uppercase">
                Exclusive Premiere
              </span>
            </motion.div>

            {/* Movie Title - Shows original Hindi title */}
            <h1 className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-2 md:mb-3 relative z-20 leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-200 to-primary animate-shimmer bg-[size:200%_auto]">
                {currentMovie.original_title}
              </span>
            </h1>

            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-white/80 mb-4 md:mb-6 font-light italic line-clamp-2">
              {currentMovie.overview || 'Duniya ki best Hindi films, ek jagah.'}
            </p>

            {/* CTA Buttons */}
            <div className="flex gap-2 md:gap-3 flex-wrap">
              <Link href={`/movie/${currentMovie.id}`}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 bg-primary text-background rounded-full font-bold text-xs md:text-base shadow-[0_0_30px_hsla(var(--primary)/0.5)] hover:shadow-[0_0_50px_hsla(var(--primary)/0.7)] transition-all"
                >
                  <Play className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" />
                  अभी देखें
                </motion.button>
              </Link>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full font-semibold text-xs md:text-base hover:bg-white/20 transition-all"
              >
                <Plus className="w-3 h-3 md:w-4 md:h-4" />
                Free Trial
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
