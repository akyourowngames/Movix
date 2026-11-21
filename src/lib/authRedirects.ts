import { SITE_URL } from './site'

export const authCallbackUrl = (next = '/') => {
  const origin = typeof window !== 'undefined' ? window.location.origin : SITE_URL
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`
}
