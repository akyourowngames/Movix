'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Film } from 'lucide-react'
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion'
import type { PointerEvent } from 'react'

export type AuthMode = 'login' | 'signup'

const COPY: Record<
  AuthMode,
  { eyebrow: string; title: string; subtitle: string }
> = {
  login: {
    eyebrow: 'CineHindi presents',
    title: 'Pick up exactly where the credits rolled.',
    subtitle:
      'Your watchlist, history and resume points — waiting on every screen.',
  },
  signup: {
    eyebrow: 'Your seat is waiting',
    title: 'Your seat in the dark is waiting.',
    subtitle:
      'Build a library that remembers every story you love, on every device.',
  },
}

const META = ['10,000+ titles', '4K HDR', 'Syncs everywhere']

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2.5 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Film className={`text-primary ${compact ? 'h-6 w-6' : 'h-7 w-7'}`} aria-hidden="true" />
      <span
        className={`font-display font-bold tracking-tight ${
          compact ? 'text-xl' : 'text-2xl'
        }`}
      >
        CineHindi
      </span>
      {!compact && (
        <span className="self-end pb-1 text-[10px] uppercase tracking-[0.3em] text-white/40">
          सिनेमाघर
        </span>
      )}
    </Link>
  )
}

function StageCopy({ mode }: { mode: AuthMode }) {
  const copy = COPY[mode]
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
      }}
      className="max-w-[540px]"
    >
      <motion.p
        variants={{
          hidden: { opacity: 0, y: 14 },
          show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        }}
        className="mb-5 border-l-2 border-primary py-1 pl-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary"
      >
        {copy.eyebrow}
      </motion.p>

      <motion.h2
        variants={{
          hidden: { opacity: 0, y: 16 },
          show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
        }}
        className="max-w-[13ch] font-display text-[clamp(2.7rem,4.3vw,4.6rem)] font-semibold leading-[1.01] tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.65)]"
      >
        {copy.title}
      </motion.h2>

      <motion.p
        variants={{
          hidden: { opacity: 0, y: 14 },
          show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
        }}
        className="mt-5 max-w-md text-base leading-7 text-white/80"
      >
        {copy.subtitle}
      </motion.p>

      <motion.ul
        variants={{
          hidden: { opacity: 0, y: 12 },
          show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        }}
        className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/65"
      >
        {META.map((item, index) => (
          <li key={item} className="flex items-center gap-5">
            {index > 0 && (
              <span className="h-1 w-1 rounded-full bg-primary/70" aria-hidden="true" />
            )}
            {item}
          </li>
        ))}
      </motion.ul>
    </motion.div>
  )
}

export function AuthStage({ mode }: { mode: AuthMode }) {
  const reduceMotion = useReducedMotion()
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const springX = useSpring(pointerX, { stiffness: 48, damping: 20 })
  const springY = useSpring(pointerY, { stiffness: 48, damping: 20 })
  const bgX = useTransform(springX, (value) => value * -16)
  const bgY = useTransform(springY, (value) => value * -10)

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType !== 'mouse') return
    const rect = event.currentTarget.getBoundingClientRect()
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5)
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5)
  }

  const resetParallax = () => {
    pointerX.set(0)
    pointerY.set(0)
  }

  return (
    <div
      className="relative h-full min-h-dvh overflow-hidden bg-[#07070a]"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetParallax}
    >
      <motion.div
        initial={reduceMotion ? false : { scale: 1.04, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        style={reduceMotion ? undefined : { x: bgX, y: bgY }}
        className="absolute -inset-6"
      >
        <Image
          src="/assets/cinema-filmstrip-wallpaper.webp"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="object-cover object-[32%_center] brightness-[0.82]"
        />
      </motion.div>

      <div className="absolute inset-0 bg-black/35" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-background/55 to-background/90" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-black/40" />
      <div className="absolute inset-y-0 right-0 w-44 bg-gradient-to-l from-background to-transparent" />

      <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
        <Brand />
        <StageCopy mode={mode} />
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">
          Cinema, series and stories — one place.
        </p>
      </div>
    </div>
  )
}

export function AuthBackdrop() {
  return (
    <div className="absolute inset-0 lg:hidden" aria-hidden="true">
      <picture className="block h-full w-full">
        <source
          media="(min-width: 640px) and (orientation: landscape)"
          srcSet="/assets/cinema-reel-cityscape.webp"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/cinema-noir-poster.webp"
          alt=""
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-cover object-[center_20%] brightness-[0.72]"
        />
      </picture>

      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-background/30 to-background" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/55 to-transparent" />
    </div>
  )
}

export function AuthMobileIntro({ mode }: { mode: AuthMode }) {
  const copy = COPY[mode]

  return (
    <div className="lg:hidden">
      <Brand compact />
      <div className="mt-8 max-w-md">
        <p className="mb-2 border-l border-primary/80 pl-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
          {copy.eyebrow}
        </p>
        <h2 className="font-display text-[1.7rem] font-semibold leading-[1.05] tracking-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.75)] sm:text-3xl">
          {copy.title}
        </h2>
        <p className="mt-3 hidden max-w-sm text-sm leading-6 text-white/70 sm:block">
          {copy.subtitle}
        </p>
      </div>
    </div>
  )
}

