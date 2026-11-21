'use client'

import Link from 'next/link'
import { Film } from 'lucide-react'
import type { ReactNode } from 'react'

export default function AuthFlowShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-background">
      <div className="absolute inset-0" aria-hidden="true">
        <picture className="block h-full w-full">
          <source media="(min-width: 1024px)" srcSet="/assets/cinema-filmstrip-wallpaper.webp" />
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
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-background/35 to-background" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4 py-10 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 self-start text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Film className="h-6 w-6 text-primary" aria-hidden="true" />
          <span className="font-display text-xl font-bold tracking-tight">CineHindi</span>
        </Link>

        <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0b0c10] shadow-[0_40px_110px_-45px_rgba(0,0,0,0.98)]">
          <div className="flex items-center justify-between gap-3 border-b border-dashed border-white/10 bg-white/[0.025] px-5 py-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
              CineHindi · Account
            </span>
            <span className="text-[10px] uppercase tracking-[0.16em] text-white/30">
              Secure
            </span>
          </div>

          <div className="px-5 pb-7 pt-6 sm:px-7">
            <p className="eyebrow mb-2 text-primary">{eyebrow}</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-white">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
        </div>

        {footer && <div className="mt-5 text-center text-sm text-white/45">{footer}</div>}
      </div>
    </main>
  )
}
