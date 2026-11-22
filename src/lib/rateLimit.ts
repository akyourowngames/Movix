import { NextResponse, type NextRequest } from 'next/server'

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()
const MAX_KEYS = 5_000

const clientKey = (request: NextRequest) => {
  const vercel = request.headers.get('x-vercel-forwarded-for')
  if (vercel) return vercel.split(',')[0].trim()
  const real = request.headers.get('x-real-ip')
  if (real) return real.trim()
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return 'unknown'
}

export const rateLimit = (
  request: NextRequest,
  name: string,
  limit: number,
  windowMs: number
) => {
  const now = Date.now()
  if (buckets.size > MAX_KEYS) {
    buckets.forEach((bucket, key) => {
      if (bucket.resetAt <= now) buckets.delete(key)
    })
    if (buckets.size > MAX_KEYS * 1.5) buckets.clear()
  }

  const key = `${name}:${clientKey(request)}`
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return null
  }

  if (bucket.count >= limit) {
    return NextResponse.json(
      { error: 'rate_limited' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))),
          'Cache-Control': 'no-store',
        },
      }
    )
  }

  bucket.count += 1
  return null
}
