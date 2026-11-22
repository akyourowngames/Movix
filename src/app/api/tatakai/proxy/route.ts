import { lookup } from 'dns/promises'
import { isIP } from 'net'
import { NextRequest, NextResponse } from 'next/server'
import { buildTatakaiProxyUrl, verifyTatakaiSignature } from '@/lib/tatakaiProxy'
import { rateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

const DNS_CACHE_TTL_MS = 5 * 60 * 1000
const dnsCache = new Map<string, { safe: boolean; expiresAt: number }>()

const isPrivateHost = (hostname: string) =>
  PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(hostname))

const isPrivateIpv4 = (address: string) => {
  const parts = address.split('.').map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true
  }
  const [a, b] = parts
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  )
}

const isPrivateIpv6 = (address: string) => {
  const value = address.toLowerCase().split('%')[0]
  if (value === '::' || value === '::1' || value.startsWith('::ffff:')) return true
  if (/^f[cd]/.test(value)) return true
  if (/^fe[89ab]/.test(value)) return true
  if (/^2001:db8/.test(value)) return true
  return false
}

const isPrivateAddress = (address: string) => {
  const version = isIP(address)
  if (version === 4) return isPrivateIpv4(address)
  if (version === 6) return isPrivateIpv6(address)
  return true
}

const assertPublicUrl = async (url: URL) => {
  if (!['https:', 'http:'].includes(url.protocol)) {
    throw new Error('Unsupported protocol')
  }
  if (isPrivateHost(url.hostname)) {
    throw new Error('Private host')
  }
  if (isIP(url.hostname)) {
    if (isPrivateAddress(url.hostname)) throw new Error('Private address')
    return
  }

  const cached = dnsCache.get(url.hostname)
  if (cached && cached.expiresAt > Date.now()) {
    if (!cached.safe) throw new Error('Private address')
    return
  }

  let addresses: { address: string }[] = []
  try {
    addresses = await lookup(url.hostname, { all: true, verbatim: true })
  } catch {
    throw new Error('DNS resolution failed')
  }

  const safe = addresses.length > 0 && addresses.every((record) => !isPrivateAddress(record.address))
  dnsCache.set(url.hostname, { safe, expiresAt: Date.now() + DNS_CACHE_TTL_MS })
  if (!safe) throw new Error('Private address')
}

const fetchSafe = async (url: URL, headers: Record<string, string>) => {
  let current = url
  for (let redirects = 0; redirects <= 5; redirects += 1) {
    await assertPublicUrl(current)
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
  const limited = rateLimit(request, 'stream-proxy', 1200, 60_000)
  if (limited) return limited

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

  try {
    await assertPublicUrl(target)
  } catch {
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
  let finalUrl: URL
  try {
    const result = await fetchSafe(target, headers)
    upstream = result.response
    finalUrl = result.url
  } catch {
    return new NextResponse('Stream host unavailable', { status: 502 })
  }

  if (!upstream.ok && upstream.status !== 206) {
    return new NextResponse('Stream rejected by upstream', { status: 502 })
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
