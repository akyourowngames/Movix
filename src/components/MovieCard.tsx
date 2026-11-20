'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Check, Heart, Plus, Play, Star } from 'lucide-react'
import type { Movie } from '@/lib/data'
import { tmdbPosterPath } from '@/lib/catalog'
import { useLocalProfile } from '@/hooks/useLocalProfile'
import { toggleMediaLike, toggleMediaWatchlist } from '@/lib/profileActions'

interface MovieCardProps {
    movie: Movie;
    type?: 'movie' | 'tv';
    variant?: 'default' | 'ranked';
}

export default function MovieCard({ movie, type = 'movie', variant = 'default' }: MovieCardProps) {
    const resolvedType = movie.mediaType ?? type
    const href = resolvedType === 'tv' ? `/tv/${movie.id}` : `/movie/${movie.id}`
    const showRank = variant === 'ranked' && typeof movie.rank === 'number' && movie.rank <= 99
    const { profile } = useLocalProfile()

    const numericId = Number(movie.id)
    const inWatchlist = profile.watchlist.some(
        (entry) => entry.id === numericId && entry.type === resolvedType
    )
    const liked = profile.likes.some(
        (entry) => entry.id === numericId && entry.type === resolvedType
    )

    const watchlistItem = {
        id: numericId,
        type: resolvedType,
        title: movie.title,
        poster: tmdbPosterPath(movie.poster),
        genres: [],
    }

    const optimizablePoster = Boolean(movie.poster) && !movie.poster.startsWith('data:')

    const handleWatchlist = (event: React.MouseEvent) => {
        event.preventDefault()
        event.stopPropagation()
        toggleMediaWatchlist(watchlistItem)
    }

    const handleLike = (event: React.MouseEvent) => {
        event.preventDefault()
        event.stopPropagation()
        toggleMediaLike({
            id: numericId,
            type: resolvedType,
            title: movie.title,
            poster: watchlistItem.poster,
            genres: [],
        })
    }

    return (
        <article className="group relative w-[min(39vw,176px)] flex-none transition-transform duration-300 ease-out hover:-translate-y-0.5 motion-reduce:transition-none sm:w-[190px] md:w-[206px] lg:w-[216px]">
            <div className="relative overflow-hidden rounded-xl bg-muted">
                <Link
                    href={href}
                    prefetch={false}
                    aria-label={`View ${movie.title}${resolvedType === 'tv' ? ' series' : ' movie'}`}
                    className="relative block aspect-[2/3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                >
                    {optimizablePoster ? (
                        <Image
                            src={movie.poster}
                            alt={`${movie.title} poster`}
                            fill
                            sizes="(max-width: 640px) 39vw, (max-width: 1024px) 206px, 216px"
                            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
                        />
                    ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={movie.poster}
                            alt={`${movie.title} poster`}
                            loading="lazy"
                            className="h-full w-full object-cover"
                        />
                    )}
                </Link>

                {/* Keeps rank + badges readable over bright artwork */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

                {showRank && (
                    <span
                        aria-hidden
                        className="pointer-events-none absolute bottom-1 left-2 z-[3] font-display text-[64px] font-black leading-none tabular-nums text-transparent transition-opacity duration-300 group-hover:opacity-85 motion-reduce:transition-none sm:text-[76px]"
                        style={{ WebkitTextStroke: '2px rgba(255,255,255,0.9)' }}
                    >
                        {movie.rank}
                    </span>
                )}

                <div className="pointer-events-none absolute right-2 top-2 z-20 rounded bg-black/75 px-2 py-1 text-[11px] font-bold text-white ring-1 ring-white/15">
                    {movie.quality}
                </div>

                {movie.isNew && (
                    <span className="pointer-events-none absolute left-2 top-2 z-20 rounded-sm bg-primary px-2 py-1 text-[10px] font-bold text-black">
                        NEW
                    </span>
                )}

                {(movie.language || (variant === 'ranked' && resolvedType === 'tv')) && (
                    <div className="pointer-events-none absolute bottom-2 right-2 z-[6] flex gap-1">
                        {variant === 'ranked' && resolvedType === 'tv' && (
                            <span className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white/80">
                                Series
                            </span>
                        )}
                        {movie.language && (
                            <span className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white/80">
                                {movie.language}
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="flex min-h-[92px] flex-col pt-2">
                <div className="mb-1 flex items-center gap-1">
                    <Star className="w-4 h-4 fill-primary text-primary" />
                    <span className="text-sm font-bold">{movie.rating}</span>
                </div>

                <h3 className="line-clamp-2 min-h-10 font-sans text-sm font-semibold leading-5 text-white">
                    {movie.title}
                </h3>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                    {movie.genre.join(' • ')}
                </p>

                <div className="mt-2 flex items-center gap-2 transition-all duration-300 ease-out md:translate-y-1.5 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100 motion-reduce:transition-none">
                    <Link
                        href={href}
                        prefetch={false}
                        aria-label={`Play ${movie.title}`}
                        className="flex min-h-10 flex-1 items-center justify-center rounded-md bg-primary py-2 text-primary-foreground transition-all duration-200 hover:scale-[1.02] hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
                    >
                        <Play fill="currentColor" className="w-4 h-4" />
                    </Link>
                    <button
                        type="button"
                        onClick={handleWatchlist}
                        aria-label={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                        className={`h-10 w-10 shrink-0 rounded-md border flex justify-center items-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            inWatchlist
                                ? 'border-primary bg-primary/20 text-primary'
                                : 'border-white/30 hover:bg-white/10 hover:border-white'
                        }`}
                    >
                        {inWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                    <button
                        type="button"
                        onClick={handleLike}
                        aria-label={liked ? 'Remove from favorites' : 'Add to favorites'}
                        className={`h-10 w-10 shrink-0 rounded-md border flex justify-center items-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            liked
                                ? 'border-primary bg-primary/20 text-primary'
                                : 'border-white/30 hover:bg-white/10 hover:border-white'
                        }`}
                    >
                        <Heart className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} />
                    </button>
                </div>
            </div>
        </article>
    )
}
