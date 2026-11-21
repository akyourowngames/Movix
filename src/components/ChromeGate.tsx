'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

const CHROMELESS_ROUTES = new Set(['/login', '/signup', '/forgot-password', '/reset-password'])

export default function ChromeGate({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  if (CHROMELESS_ROUTES.has(pathname)) return null
  return <>{children}</>
}
