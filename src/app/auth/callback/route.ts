import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const requestedNext = searchParams.get('next') ?? '/'
  const nextUrl = new URL(requestedNext, origin)
  const next =
    requestedNext.startsWith('/') &&
    !requestedNext.startsWith('//') &&
    !requestedNext.includes('\\') &&
    nextUrl.origin === origin
      ? `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`
      : '/'

  if (code) {
    const supabase = createServerSupabaseClient()
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent('Could not confirm your email. Try signing in.')}`
  )
}
