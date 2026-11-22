import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const VISITOR_COOKIE = 'ch_vid'
const SESSION_COOKIE = 'ch_sid'
const VISITOR_MAX_AGE = 60 * 60 * 24 * 365
const SESSION_MAX_AGE = 60 * 30
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const BOT_PATTERN =
  /bot|crawler|spider|slurp|bingpreview|headless|phantom|selenium|puppeteer|lighthouse|pagespeed|gtmetrix|curl|wget|python-requests|axios|node-fetch|go-http-client|okhttp/i

const cookieId = (request: NextRequest, name: string) => {
  const value = request.cookies.get(name)?.value || ''
  return UUID_PATTERN.test(value) ? value : randomUUID()
}

const deviceFromUserAgent = (userAgent: string) => {
  if (/iPad|Tablet|PlayBook|Silk/i.test(userAgent)) return 'tablet'
  if (/Mobile|iPhone|iPod|Android|Windows Phone/i.test(userAgent)) return 'mobile'
  return 'desktop'
}

const safePath = (value: unknown) => {
  let path = String(value || '/')
  if (/^https?:\/\//i.test(path)) {
    try {
      const url = new URL(path)
      path = `${url.pathname}${url.search}`
    } catch {
      path = '/'
    }
  }
  if (!path.startsWith('/')) path = '/'
  if (path.startsWith('/admin')) return ''
  return path.slice(0, 512)
}

export async function POST(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || ''
  if (BOT_PATTERN.test(userAgent)) {
    return new NextResponse(null, { status: 204 })
  }

  let payload: { event?: string; path?: string; referrer?: string } = {}
  try {
    payload = await request.json()
  } catch {
    payload = {}
  }

  const event = payload.event === 'page_view' ? 'page_view' : 'heartbeat'
  const path = safePath(payload.path)
  if (!path) return new NextResponse(null, { status: 204 })

  let referrer = String(payload.referrer || '').slice(0, 512)
  if (referrer.startsWith(request.nextUrl.origin)) referrer = ''

  const visitorId = cookieId(request, VISITOR_COOKIE)
  const sessionId = cookieId(request, SESSION_COOKIE)
  const country = (request.headers.get('x-vercel-ip-country') || '').toUpperCase().slice(0, 2)
  const device = deviceFromUserAgent(userAgent)

  const supabase = createServerSupabaseClient()
  if (supabase) {
    try {
      await supabase.rpc('track_analytics_event', {
        p_event: event,
        p_path: path,
        p_referrer: referrer,
        p_visitor_id: visitorId,
        p_session_id: sessionId,
        p_user_agent: userAgent,
        p_country: country,
        p_device: device,
      })
    } catch {
      // Analytics is best-effort and must never block navigation.
    }
  }

  const response = new NextResponse(null, { status: 204 })
  const secure = process.env.NODE_ENV === 'production'
  response.cookies.set(VISITOR_COOKIE, visitorId, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: VISITOR_MAX_AGE,
  })
  response.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
  return response
}
