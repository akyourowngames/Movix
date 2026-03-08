'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import MovieCard from './MovieCard'
import type { Movie } from '@/lib/data'

interface MovieCarouselProps {
    title: string;
    hindiTitle?: string;
    movies: Movie[];
    type?: 'movie' | 'tv';
}

export default function MovieCarousel({ title, hindiTitle, movies, type = 'movie' }: MovieCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null)

    const scrollLeft = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: -600, behavior: 'smooth' })
        }
    }

    const scrollRight = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: 600, behavior: 'smooth' })
        }
    }

    return (
        <section className="relative py-12 group overflow-hidden">
            <div className="container mx-auto px-6 max-w-7xl mb-6 flex justify-between items-end">
                <div className="flex-1 min-w-0">
                    <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2 truncate">
                        {hindiTitle || title}
                    </h2>
                    <p className="text-white/50 text-xs md:text-sm tracking-widest uppercase">{title}</p>
                </div>

                <div className="hidden md:flex gap-2 flex-shrink-0 ml-4">
                    <button
                        onClick={scrollLeft}
                        className="w-12 h-12 rounded-full border border-white/10 glassmorphism flex justify-center items-center hover:bg-white/10 hover:border-white/30 transition-all opacity-0 group-hover:opacity-100"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={scrollRight}
                        className="w-12 h-12 rounded-full border border-white/10 glassmorphism flex justify-center items-center hover:bg-white/10 hover:border-white/30 transition-all opacity-0 group-hover:opacity-100"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="relative w-full overflow-hidden">
                {/* Shadow overlays for smooth edge fading */}
                <div className="absolute left-0 top-0 w-16 h-full bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

                <div
                    ref={scrollRef}
                    className="flex gap-6 overflow-x-auto snap-x snap-mandatory hide-scrollbar px-6 pb-10 pt-4"
                    style={{ scrollPaddingLeft: '24px', scrollPaddingRight: '24px' }}
                >
                    {movies.map((movie, index) => (
                        <div key={movie.id} className="snap-start shrink-0">
                            <MovieCard movie={movie} index={index} type={type} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
