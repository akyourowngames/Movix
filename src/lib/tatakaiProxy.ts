import { createHmac, timingSafeEqual } from 'crypto'

const SECRET = process.env.TATAKAI_PROXY_SECRET || 'cinehindi-tatakai-proxy-v1'

export const signTatakaiUrl = (url: string, referer: string) =>
  createHmac('sha256', SECRET)
    .update(`${url}\n${referer}`)
    .digest('base64url')

export const buildTatakaiProxyUrl = (url: string, referer: string) =>
  `/api/tatakai/proxy?url=${encodeURIComponent(url)}&ref=${encodeURIComponent(referer)}&sig=${signTatakaiUrl(url, referer)}`

export const verifyTatakaiSignature = (
  url: string,
  referer: string,
  signature: string
) => {
  if (!signature) return false
  const expected = signTatakaiUrl(url, referer)
  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (actualBuffer.length !== expectedBuffer.length) return false
  return timingSafeEqual(actualBuffer, expectedBuffer)
}
