'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export const getSupabase = () => {
  if (!supabaseUrl || !supabaseKey) return null
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(supabaseUrl, supabaseKey)
  }
  return browserClient
}
