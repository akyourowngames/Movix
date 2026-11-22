import { NextRequest, NextResponse } from 'next/server'
import { buildTatakaiProxyUrl, verifyTatakaiSignature } from '@/lib/tatakaiProxy'

export const dynamic = 'force-dynamic'

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^169\.254\./,
  /^0\.0\.0\.0$/,
  /^\[::1\]$/,
  /\.local$/i,
]

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'

const isPrivateHost = (hostname: string) =>
  PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(hostname))

const rewriteManifest = (manifest: string, baseUrl: string, referer: string) =>
  manifest
    .split(/\r?\n/)
    .map((line) => {
      const raw = line.trim()
      if (!raw) return line

      if (raw.startsWith('#')) {
        if (!raw.includes('URI="')) return line
        return line.replace(/URI="([^"]+)"/g, (match, uri: string) => {
          if (/^(data:|blob:|skd:)/i.test(uri)) return match
          try {
            return `URI="${buildTatakaiProxyUrl(new URL(uri, baseUrl).toString(), referer)}"`
          } catch {
            return match
          }
        })
      }

      if (/^(data:|blob:)/i.test(raw)) return line
      try {
        return buildTatakaiProxyUrl(new URL(raw, baseUrl).toString(), referer)
      } catch {
        return line
      }
    })
    .join('\n')

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const rawUrl = params.get('url') || ''
  const rawReferer = params.get('ref') || 'https://megaplay.buzz/'
  const signature = params.get('sig') || ''

  if (!verifyTatakaiSignature(rawUrl, rawReferer, signature)) {
    return new NextResponse('Invalid stream signature', { status: 403 })
  }

  let target: URL
  try {
    target = new URL(rawUrl)
  } catch {
    return new NextResponse('Invalid stream URL', { status: 400 })
  }

  if (!['https:', 'http:'].includes(target.protocol)) {
    return new NextResponse('Unsupported protocol', { status: 400 })
  }
  if (isPrivateHost(target.hostname)) {
    return new NextResponse('Stream host not allowed', { status: 400 })
  }

  let refererUrl: URL
  try {
    refererUrl = new URL(rawReferer)
    if (!['https:', 'http:'].includes(refererUrl.protocol)) {
      throw new Error('Invalid referer protocol')
    }
    if (isPrivateHost(refererUrl.hostname)) {
      throw new Error('Referer host not allowed')
    }
  } catch {
    return new NextResponse('Invalid stream referer', { status: 400 })
  }

  const referer = refererUrl.toString()
  const headers: Record<string, string> = {
    'User-Agent': USER_AGENT,
    Accept: '*/*',
    Referer: referer,
    Origin: refererUrl.origin,
  }

  const range = request.headers.get('range')
  if (range) headers.Range = range

  let upstream: Response
  try {
    upstream = await fetch(target, {
      headers,
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    })
  } catch {
    return new NextResponse('Stream host unavailable', { status: 502 })
  }

  if (!upstream.ok && upstream.status !== 206) {
    return new NextResponse('Stream rejected by upstream', { status: 502 })
  }

  const finalUrl = new URL(upstream.url || target.toString())
  if (isPrivateHost(finalUrl.hostname)) {
    return new NextResponse('Stream redirected to a disallowed host', { status: 502 })
  }

  const contentType = (upstream.headers.get('content-type') || '').toLowerCase()
  const isManifest = contentType.includes('mpegurl') || /\.m3u8$/i.test(finalUrl.pathname)

  const responseHeaders = new Headers()
  ;[
    'content-range',
    'accept-ranges',
    'etag',
    'last-modified',
  ].forEach((name) => {
    const value = upstream.headers.get(name)
    if (value) responseHeaders.set(name, value)
  })
  responseHeaders.set('Access-Control-Allow-Origin', '*')
  responseHeaders.set(
    'Access-Control-Expose-Headers',
    'Content-Length, Content-Range, Accept-Ranges'
  )

  if (isManifest) {
    const manifest = await upstream.text()
    const rewritten = rewriteManifest(manifest, finalUrl.toString(), referer)
    responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8')
    responseHeaders.set('Cache-Control', 'no-store')
    return new NextResponse(rewritten, {
      status: upstream.status === 206 ? 200 : upstream.status,
      headers: responseHeaders,
    })
  }

  const upstreamType = upstream.headers.get('content-type')
  if (upstreamType) responseHeaders.set('Content-Type', upstreamType)
  const cacheControl = upstream.headers.get('cache-control')
  if (cacheControl) responseHeaders.set('Cache-Control', cacheControl)

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  })
}
