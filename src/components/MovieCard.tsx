'use client'

import { motion } from 'framer-motion'
import { Plus, Play, Star } from 'lucide-react'
import type { Movie } from '@/lib/data'
import Link from 'next/link'

interface MovieCardProps {
    movie: Movie;
    index: number;
    type?: 'movie' | 'tv';
}

export default function MovieCard({ movie, index, type = 'movie' }: MovieCardProps) {
    const href = type === 'tv' ? `/tv/${movie.id}` : `/movie/${movie.id}`
    
    return (
        <Link href={href}>
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover="hover"
            className="relative flex-none w-[200px] md:w-[240px] aspect-[2/3] rounded-xl overflow-hidden cursor-pointer group origin-center perspective-1000"
        >
            {/* Perspective tilt effect handled by CSS via hover scale */}
            <div className="absolute inset-0 bg-background/20 transition-transform duration-500 group-hover:scale-110 z-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-full h-full object-cover rounded-xl"
                />
            </div>

            <div className="absolute top-2 right-2 rounded bg-background/80 backdrop-blur-md px-2 py-1 text-xs font-bold ring-1 ring-white/20 z-20">
                {movie.quality}
            </div>

            {/* Hover Overlay */}
            <motion.div
                variants={{
                    hover: { opacity: 1, y: 0 }
                }}
                initial={{ opacity: 0, y: 20 }}
                className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10 flex flex-col justify-end p-4 transition-all duration-300"
            >
                <div className="flex items-center gap-1 mb-2">
                    <Star className="w-4 h-4 fill-primary text-primary" />
                    <span className="text-sm font-bold">{movie.rating}</span>
                </div>

                <h3 className="font-display font-bold text-xl drop-shadow-md leading-tight mb-1">
                    {movie.hindiTitle || movie.title}
                </h3>
                <p className="text-xs text-white/70 mb-4 line-clamp-2">
                    {movie.genre.join(' • ')}
                </p>

                <div className="flex items-center gap-2">
                    <button className="flex-1 bg-primary text-primary-foreground rounded-full py-2 flex justify-center items-center hover:bg-gold-400 transition-colors">
                        <Play fill="currentColor" className="w-4 h-4" />
                    </button>
                    <button className="w-10 h-10 rounded-full border border-white/30 flex justify-center items-center hover:bg-white/10 hover:border-white transition-colors">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>
        </motion.div>
        </Link>
    )
}
