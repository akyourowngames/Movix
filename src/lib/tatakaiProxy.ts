import { createHmac, timingSafeEqual } from 'crypto'

const SECRET =
  String(process.env.TATAKAI_PROXY_SECRET || '').trim() ||
  (process.env.NODE_ENV !== 'production' ? 'cinehindi-dev-tatakai-proxy' : '')

const requireSecret = () => {
  if (!SECRET) {
    throw new Error('TATAKAI_PROXY_SECRET is not configured')
  }
  return SECRET
}

export const signTatakaiUrl = (url: string, referer: string) => {
  const secret = requireSecret()
  return createHmac('sha256', secret)
    .update(`${url}\n${referer}`)
    .digest('base64url')
}

export const buildTatakaiProxyUrl = (url: string, referer: string) =>
  `/api/tatakai/proxy?url=${encodeURIComponent(url)}&ref=${encodeURIComponent(referer)}&sig=${signTatakaiUrl(url, referer)}`

export const verifyTatakaiSignature = (
  url: string,
  referer: string,
  signature: string
) => {
  if (!signature || !SECRET) return false
  try {
    const expected = signTatakaiUrl(url, referer)
    const actualBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expected)
    if (actualBuffer.length !== expectedBuffer.length) return false
    return timingSafeEqual(actualBuffer, expectedBuffer)
  } catch {
    return false
  }
}
