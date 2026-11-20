'use client'

import { useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import MovieCard from './MovieCard'
import type { Movie } from '@/lib/data'

interface MovieCarouselProps {
    title: string;
    hindiTitle?: string;
    subtitle?: string;
    movies: Movie[];
    type?: 'movie' | 'tv';
    variant?: 'default' | 'ranked';
}

export default function MovieCarousel({ title, hindiTitle, subtitle, movies, type = 'movie', variant = 'default' }: MovieCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const prefersReducedMotion = useReducedMotion()

    const scrollLeft = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({
                left: -600,
                behavior: prefersReducedMotion ? 'auto' : 'smooth',
            })
        }
    }

    const scrollRight = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({
                left: 600,
                behavior: prefersReducedMotion ? 'auto' : 'smooth',
            })
        }
    }

    return (
        <section className="group relative overflow-hidden py-7 md:py-9">
            <div className="page-shell mb-5 flex items-end justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <h2 className="truncate font-display text-2xl font-semibold tracking-tight text-white md:text-3xl">
                        {title}
                    </h2>
                    {(hindiTitle || subtitle) && (
                        <p className="mt-1 text-xs tracking-wide text-muted-foreground md:text-sm">
                            {hindiTitle}
                            {hindiTitle && subtitle ? <span className="text-white/30"> · </span> : null}
                            {subtitle}
                        </p>
                    )}
                </div>

                <div className="hidden md:flex gap-2 flex-shrink-0 ml-4">
                    <button
                        type="button"
                        onClick={scrollLeft}
                        aria-label={`Scroll ${title} left`}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        type="button"
                        onClick={scrollRight}
                        aria-label={`Scroll ${title} right`}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="relative w-full overflow-hidden">
                {/* Shadow overlays for smooth edge fading */}
                <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-background to-transparent" />
                <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-background to-transparent" />

                <div
                    ref={scrollRef}
                    className="page-shell flex snap-x snap-mandatory gap-4 overflow-x-auto hide-scrollbar pb-3 pt-1 sm:gap-5"
                    style={{ scrollPaddingLeft: '1.5rem', scrollPaddingRight: '1.5rem' }}
                >
                    {movies.map((movie) => (
                        <div key={movie.id} className="snap-start shrink-0">
                            <MovieCard
                                movie={movie}
                                type={movie.mediaType ?? type}
                                variant={variant}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
