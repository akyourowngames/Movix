'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const HEARTBEAT_MS = 30_000
const IDLE_CUTOFF_MS = 15 * 60 * 1000
const ENDPOINT = '/api/pulse'
const BOT_PATTERN =
  /bot|crawler|spider|slurp|bingpreview|headless|phantom|selenium|puppeteer|lighthouse|pagespeed|gtmetrix/i

const isBot = () => {
  if (typeof navigator === 'undefined') return true
  if (navigator.webdriver) return true
  return BOT_PATTERN.test(navigator.userAgent)
}

type TrackEvent = 'page_view' | 'heartbeat'

const sendEvent = (event: TrackEvent, path: string) => {
  const body = JSON.stringify({
    event,
    path,
    referrer: typeof document !== 'undefined' ? document.referrer : '',
  })

  void fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // Analytics must never break the page.
  })
}

export default function AnalyticsTracker() {
  const pathname = usePathname()
  const lastPathRef = useRef('')
  const lastActivityRef = useRef(Date.now())

  useEffect(() => {
    if (isBot() || pathname.startsWith('/admin')) return

    let cancelled = false
    lastActivityRef.current = Date.now()
    const currentPath = `${pathname}${window.location.search}`

    if (lastPathRef.current !== currentPath) {
      lastPathRef.current = currentPath
      sendEvent('page_view', currentPath)
    }

    const isIdle = () => Date.now() - lastActivityRef.current > IDLE_CUTOFF_MS
    const markActive = () => {
      lastActivityRef.current = Date.now()
    }

    const heartbeat = () => {
      if (cancelled || document.visibilityState !== 'visible' || isIdle()) return
      const path = `${window.location.pathname}${window.location.search}`
      sendEvent('heartbeat', path)
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        markActive()
        heartbeat()
      }
    }

    const onPageHide = () => {
      if (cancelled || isIdle()) return
      const path = `${window.location.pathname}${window.location.search}`
      const body = JSON.stringify({ event: 'heartbeat', path, referrer: document.referrer })
      if (navigator.sendBeacon) {
        navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }))
      }
    }

    const interval = window.setInterval(heartbeat, HEARTBEAT_MS)
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('pointerdown', markActive, { passive: true })
    window.addEventListener('keydown', markActive, { passive: true })
    window.addEventListener('scroll', markActive, { passive: true })
    window.addEventListener('touchstart', markActive, { passive: true })

    return () => {
      cancelled = true
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('pointerdown', markActive)
      window.removeEventListener('keydown', markActive)
      window.removeEventListener('scroll', markActive)
      window.removeEventListener('touchstart', markActive)
    }
  }, [pathname])

  return null
}
