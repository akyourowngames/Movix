import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Images use a custom external loader; the built-in optimizer is not needed.
  if (request.nextUrl.pathname === '/_next/image') {
    return new NextResponse(null, { status: 404 })
  }
  return updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|favicon.ico|screenshots/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest|html)$).*)',
  ],
}
