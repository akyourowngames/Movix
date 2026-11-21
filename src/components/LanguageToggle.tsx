'use client'

import { Languages } from 'lucide-react'
import { useLanguage } from '@/components/LanguageProvider'

export default function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage()
  const nextLabel = language === 'en' ? 'Switch to Hindi' : 'Switch to English'

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={nextLabel}
      title={nextLabel}
      className="flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2 text-[11px] font-semibold uppercase tracking-wider text-white/70 transition-colors hover:border-white/25 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <Languages className="hidden h-4 w-4 sm:block" aria-hidden="true" />
      <span aria-hidden="true">{language === 'en' ? 'EN' : 'हिं'}</span>
    </button>
  )
}
