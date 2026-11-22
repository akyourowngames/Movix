import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const schemaMissing = (message: string) =>
  /does not exist|schema cache|PGRST202|42P01/i.test(message)

export async function GET() {
  const supabase = createServerSupabaseClient()
  if (!supabase) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  }

  const { data, error } = await supabase.rpc('analytics_overview')

  if (error) {
    if (error.code === '42501' || /not_admin/i.test(error.message || '')) {
      const { data: userData } = await supabase.auth.getUser()
      return NextResponse.json(
        { error: userData.user ? 'forbidden' : 'unauthorized' },
        { status: userData.user ? 403 : 401 }
      )
    }
    if (schemaMissing(error.message || '') || error.code === 'PGRST202') {
      return NextResponse.json({ error: 'analytics_schema_missing' }, { status: 503 })
    }
    return NextResponse.json({ error: 'analytics_unavailable' }, { status: 500 })
  }

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
