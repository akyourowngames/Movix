import { lookup } from 'dns/promises'
import { isIP } from 'net'

export const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'

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

const DNS_CACHE_TTL_MS = 5 * 60 * 1000
const dnsCache = new Map<string, { safe: boolean; expiresAt: number }>()

export const isPrivateHost = (hostname: string) =>
  PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(hostname))

export const isPrivateIpv4 = (address: string) => {
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

export const isPrivateIpv6 = (address: string) => {
  const value = address.toLowerCase().split('%')[0]
  if (value === '::' || value === '::1' || value.startsWith('::ffff:')) return true
  if (/^f[cd]/.test(value)) return true
  if (/^fe[89ab]/.test(value)) return true
  if (/^2001:db8/.test(value)) return true
  return false
}

export const isPrivateAddress = (address: string) => {
  const version = isIP(address)
  if (version === 4) return isPrivateIpv4(address)
  if (version === 6) return isPrivateIpv6(address)
  return true
}

export const isPublicHttpsUrl = (value: string) => {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return false
    if (isPrivateHost(url.hostname)) return false
    if (isIP(url.hostname) && isPrivateAddress(url.hostname)) return false
    return true
  } catch {
    return false
  }
}

export const assertPublicUrl = async (url: URL) => {
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
