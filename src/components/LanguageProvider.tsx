'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Language = 'en' | 'hi'

const STORAGE_KEY = 'cinehindi:lang'

interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  toggleLanguage: () => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const normalize = (value: string | null | undefined): Language =>
  value === 'hi' ? 'hi' : 'en'

const readLanguage = (): Language => {
  if (typeof document === 'undefined') return 'en'
  const fromAttribute = document.documentElement.dataset.lang
  if (fromAttribute === 'en' || fromAttribute === 'hi') return fromAttribute
  try {
    return normalize(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    return 'en'
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  const applyLanguage = useCallback((next: Language) => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.lang = next
      document.documentElement.lang = next === 'hi' ? 'hi' : 'en'
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Language still applies for this session.
    }
    setLanguageState(next)
  }, [])

  useEffect(() => {
    const stored = readLanguage()
    document.documentElement.dataset.lang = stored
    document.documentElement.lang = stored === 'hi' ? 'hi' : 'en'
    setLanguageState(stored)
  }, [])

  const setLanguage = useCallback(
    (next: Language) => applyLanguage(next),
    [applyLanguage]
  )

  const toggleLanguage = useCallback(() => {
    applyLanguage(language === 'en' ? 'hi' : 'en')
  }, [applyLanguage, language])

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage }),
    [language, setLanguage, toggleLanguage]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside <LanguageProvider>')
  return context
}
