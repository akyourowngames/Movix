'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { detachUser, setCloudUser, syncOnSignIn } from '@/lib/cloud'

export interface UserProfile {
  id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

interface AuthResult {
  error: string | null
  needsConfirmation?: boolean
}

interface AuthContextValue {
  configured: boolean
  loading: boolean
  syncing: boolean
  user: User | null
  profile: UserProfile | null
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (email: string, password: string, displayName?: string) => Promise<AuthResult>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const friendlyError = (message: string) => {
  if (/invalid login credentials/i.test(message)) return 'Incorrect email or password.'
  if (/email not confirmed/i.test(message)) return 'Please confirm your email before signing in.'
  if (/already registered/i.test(message)) return 'An account with this email already exists. Try signing in.'
  if (/password should be at least/i.test(message)) return 'Password must be at least 6 characters.'
  if (/rate limit/i.test(message)) return 'Too many attempts. Please wait a moment and try again.'
  return message
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [syncing, setSyncing] = useState(false)

  const loadProfile = useCallback(async (userId: string) => {
    const supabase = getSupabase()
    if (!supabase) return

    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, created_at')
      .eq('id', userId)
      .maybeSingle()

    if (data) {
      setProfile(data)
      return
    }

    const { data: authUser } = await supabase.auth.getUser()
    const fallbackName =
      (authUser.user?.user_metadata?.display_name as string | undefined) ??
      authUser.user?.email?.split('@')[0] ??
      null

    const { data: created } = await supabase
      .from('profiles')
      .upsert({ id: userId, display_name: fallbackName })
      .select('id, display_name, avatar_url, created_at')
      .maybeSingle()

    if (created) setProfile(created)
  }, [])

  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) {
      setLoading(false)
      return
    }

    let cancelled = false

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [])

  const userId = user?.id ?? null

  useEffect(() => {
    if (!userId) {
      setCloudUser(null)
      setProfile(null)
      setSyncing(false)
      return
    }

    let cancelled = false
    setCloudUser(userId)
    setSyncing(true)

    syncOnSignIn(userId).finally(() => {
      if (!cancelled) setSyncing(false)
    })
    void loadProfile(userId)

    return () => {
      cancelled = true
    }
  }, [userId, loadProfile])

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const supabase = getSupabase()
    if (!supabase) return { error: 'Accounts are not configured on this deployment.' }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? friendlyError(error.message) : null }
  }, [])

  const signUp = useCallback(
    async (email: string, password: string, displayName?: string): Promise<AuthResult> => {
      const supabase = getSupabase()
      if (!supabase) return { error: 'Accounts are not configured on this deployment.' }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: displayName ? { display_name: displayName } : undefined,
          emailRedirectTo:
            typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
        },
      })

      if (error) return { error: friendlyError(error.message) }
      return { error: null, needsConfirmation: !data.session }
    },
    []
  )

  const signOut = useCallback(async () => {
    const supabase = getSupabase()
    if (!supabase) return

    await supabase.auth.signOut()
    detachUser()
    setUser(null)
    setProfile(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (userId) await loadProfile(userId)
  }, [userId, loadProfile])

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: isSupabaseConfigured,
      loading,
      syncing,
      user,
      profile,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [loading, syncing, user, profile, signIn, signUp, signOut, refreshProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return context
}
