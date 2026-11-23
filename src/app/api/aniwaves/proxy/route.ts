import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rateLimit'
import { assertPublicUrl, USER_AGENT } from '@/lib/safeUrl'
import { buildAniWavesProxyUrl, verifyAniWavesSignature } from '@/lib/aniwavesProxy'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

const isAllowedHost = (url: URL) => {
  const host = url.hostname.toLowerCase()
  return host === 'winghoster.site' || host.endsWith('.winghoster.site') ||
    host === 'roburnt10.store' || host.endsWith('.roburnt10.store') ||
    host === 'vhscdn.to' || host.endsWith('.vhscdn.to')
}

const fetchSafe = async (url: URL, headers: Record<string, string>) => {
  let current = url
  for (let redirects = 0; redirects <= 5; redirects += 1) {
    await assertPublicUrl(current)
    if (!isAllowedHost(current)) throw new Error('Host not allowed')
    const response = await fetch(current, {
      headers,
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    })
    if (![301, 302, 303, 307, 308].includes(response.status)) {
      return { response, url: current }
    }
    const location = response.headers.get('location')
    if (!location) return { response, url: current }
    current = new URL(location, current)
  }
  throw new Error('Too many redirects')
}

const rewriteManifest = (manifest: string, baseUrl: string) =>
  manifest
    .split(/\r?\n/)
    .map((line) => {
      const raw = line.trim()
      if (!raw) return line
      if (raw.startsWith('#')) {
        if (!raw.includes('URI="')) return line
        return line.replace(/URI="([^"]+)"/g, (match, uri: string) => {
          if (/^(data:|blob:)/i.test(uri)) return match
          try {
            return `URI="${buildAniWavesProxyUrl(new URL(uri, baseUrl).toString())}"`
          } catch {
            return match
          }
        })
      }
      try {
        return buildAniWavesProxyUrl(new URL(raw, baseUrl).toString())
      } catch {
        return line
      }
    })
    .join('\n')

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, 'aniwaves-proxy', 6000, 60_000)
  if (limited) return limited

  const target = request.nextUrl.searchParams.get('url') || ''
  const signature = request.nextUrl.searchParams.get('sig') || ''
  if (!target || !verifyAniWavesSignature(target, signature)) {
    return new NextResponse('Invalid proxy signature', { status: 400 })
  }

  let url: URL
  try {
    url = new URL(target)
    if (url.protocol !== 'https:') throw new Error('HTTPS required')
    if (!isAllowedHost(url)) throw new Error('Host not allowed')
  } catch {
    return new NextResponse('Invalid URL', { status: 400 })
  }

  const headers: Record<string, string> = {
    'User-Agent': USER_AGENT,
    Accept: '*/*',
    Referer: 'https://play.vhscdn.to/',
  }
  const range = request.headers.get('range')
  if (range) headers.Range = range

  try {
    const { response, url: finalUrl } = await fetchSafe(url, headers)
    const contentType = response.headers.get('content-type') || ''
    const isManifest = /mpegurl/i.test(contentType) || finalUrl.pathname.endsWith('.m3u8')

    if (isManifest) {
      const manifest = await response.text()
      if (!manifest.includes('#EXTM3U')) {
        return new NextResponse('Invalid manifest', { status: 502 })
      }
      return new NextResponse(rewriteManifest(manifest, finalUrl.toString()), {
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      })
    }

    const responseHeaders = new Headers()
    responseHeaders.set('Content-Type', contentType || 'application/octet-stream')
    responseHeaders.set('Cache-Control', 'no-store')
    const contentLength = response.headers.get('content-length')
    if (contentLength) responseHeaders.set('Content-Length', contentLength)
    const contentRange = response.headers.get('content-range')
    if (contentRange) responseHeaders.set('Content-Range', contentRange)
    responseHeaders.set('Accept-Ranges', 'bytes')

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch {
    return new NextResponse('Stream unavailable', { status: 502 })
  }
}
