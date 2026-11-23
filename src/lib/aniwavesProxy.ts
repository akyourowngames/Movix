import { createHmac, timingSafeEqual } from 'crypto'

const SECRET =
  String(process.env.ANIWAVES_PROXY_SECRET || process.env.TATAKAI_PROXY_SECRET || '').trim() ||
  (process.env.NODE_ENV !== 'production'
    ? 'cinehindi-dev-aniwaves-proxy'
    : 'cinehindi-aniwaves-proxy-v1')

const sign = (url: string) => {
  if (!SECRET) throw new Error('ANIWAVES_PROXY_SECRET is not configured')
  return createHmac('sha256', SECRET).update(url).digest('hex')
}

export const buildAniWavesProxyUrl = (url: string) =>
  `/api/aniwaves/proxy?url=${encodeURIComponent(url)}&sig=${sign(url)}`

export const verifyAniWavesSignature = (url: string, signature: string) => {
  if (!SECRET || !signature) return false
  const expected = sign(url)
  if (expected.length !== signature.length) return false
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}
