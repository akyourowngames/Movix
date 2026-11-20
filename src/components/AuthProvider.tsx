'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  syncingUserId: string | null
  user: User | null
  profile: UserProfile | null
  profileError: string | null
  librarySyncError: boolean
  retryLibrarySync: () => Promise<boolean>
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
  const [syncingUserId, setSyncingUserId] = useState<string | null>(null)
  const profileRequestId = useRef(0)
  const librarySyncRequestId = useRef(0)
  const currentUserIdRef = useRef<string | null>(null)

  const loadProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    const supabase = getSupabase()
    if (!supabase) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, created_at')
      .eq('id', userId)
      .maybeSingle()

    if (data) {
      if (data.id !== userId) throw new Error('Profile ownership did not match the active account.')
      return data
    }

    if (error) {
      throw new Error('Unable to load your account profile.')
    }

    const { data: authUser, error: authError } = await supabase.auth.getUser()
    if (authError || authUser.user?.id !== userId) {
      throw new Error('Your session changed while loading your profile. Please refresh.')
    }
    const fallbackName =
      (authUser.user?.user_metadata?.display_name as string | undefined) ??
      authUser.user?.email?.split('@')[0] ??
      null

    const { data: created, error: createError } = await supabase
      .from('profiles')
      .upsert({ id: userId, display_name: fallbackName })
      .select('id, display_name, avatar_url, created_at')
      .maybeSingle()

    if (createError || !created) {
      throw new Error('Unable to prepare your account profile. Please try again.')
    }

    return created
  }, [])

  const [profileError, setProfileError] = useState<string | null>(null)
  const [librarySyncError, setLibrarySyncError] = useState(false)

  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) {
      setLoading(false)
      return
    }

    let cancelled = false
    let authEventObserved = false

    void supabase.auth.getSession()
      .then(({ data, error }) => {
        if (cancelled || authEventObserved) return
        if (error) {
          setUser(null)
          setProfileError('Unable to restore your session. Please refresh the page.')
          return
        }
        setUser(data.session?.user ?? null)
      })
      .catch(() => {
        if (!cancelled && !authEventObserved) {
          setUser(null)
          setProfileError('Unable to restore your session. Please refresh the page.')
        }
      })
      .finally(() => {
        if (!cancelled && !authEventObserved) setLoading(false)
      })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      authEventObserved = true
      setUser(session?.user ?? null)
      setLoading(false)
      setProfileError(null)
    })

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [])

  const userId = user?.id ?? null
  currentUserIdRef.current = userId

  useEffect(() => {
    if (!userId) {
      profileRequestId.current += 1
      librarySyncRequestId.current += 1
      setCloudUser(null)
      setProfile(null)
      setSyncing(false)
      setSyncingUserId(null)
      setProfileError(null)
      setLibrarySyncError(false)
      return
    }

    const requestId = profileRequestId.current + 1
    profileRequestId.current = requestId
    const syncRequestId = librarySyncRequestId.current + 1
    librarySyncRequestId.current = syncRequestId
    let cancelled = false
    setProfile(null)
    setProfileError(null)
    setLibrarySyncError(false)
    setCloudUser(userId)
    setSyncing(true)
    setSyncingUserId(userId)

    const profileResult = loadProfile(userId)
      .then((nextProfile) => ({ nextProfile, failed: false }))
      .catch(() => ({ nextProfile: null, failed: true }))

    void Promise.all([syncOnSignIn(userId), profileResult])
      .then(([syncSucceeded, result]) => {
        if (cancelled || profileRequestId.current !== requestId) return
        if (librarySyncRequestId.current === syncRequestId) {
          setLibrarySyncError(!syncSucceeded)
        }
        if (result.failed) {
          setProfile(null)
          setProfileError('Your account profile could not be loaded. Please retry.')
        } else if (result.nextProfile) {
          setProfile(result.nextProfile)
        }
      })
      .finally(() => {
        if (!cancelled && profileRequestId.current === requestId) {
          setSyncing(false)
          setSyncingUserId(null)
        }
      })

    return () => {
      cancelled = true
      if (profileRequestId.current === requestId) {
        profileRequestId.current += 1
      }
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

    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new Error('Unable to sign out. Please try again.')
    }
    detachUser()
    setUser(null)
    setProfile(null)
    setSyncing(false)
    setSyncingUserId(null)
    profileRequestId.current += 1
    librarySyncRequestId.current += 1
    setProfileError(null)
    setLibrarySyncError(false)
  }, [])

  const refreshProfile = useCallback(async () => {
    const requestedUserId = currentUserIdRef.current
    if (!requestedUserId) return
    const requestId = profileRequestId.current
    setProfileError(null)
    try {
      const nextProfile = await loadProfile(requestedUserId)
      if (
        nextProfile &&
        currentUserIdRef.current === requestedUserId &&
        profileRequestId.current === requestId
      ) {
        setProfile(nextProfile)
      }
    } catch {
      if (currentUserIdRef.current === requestedUserId && profileRequestId.current === requestId) {
        setProfileError('Your account profile could not be loaded. Please retry.')
      }
      throw new Error('Unable to refresh your account profile.')
    }
  }, [loadProfile])

  const retryLibrarySync = useCallback(async () => {
    const requestedUserId = currentUserIdRef.current
    if (!requestedUserId) return false

    const requestId = profileRequestId.current
    const syncRequestId = librarySyncRequestId.current + 1
    librarySyncRequestId.current = syncRequestId
    setSyncing(true)
    setSyncingUserId(requestedUserId)
    setLibrarySyncError(false)
    const succeeded = await syncOnSignIn(requestedUserId)

    if (
      currentUserIdRef.current !== requestedUserId ||
      profileRequestId.current !== requestId ||
      librarySyncRequestId.current !== syncRequestId
    ) {
      return false
    }

    setSyncing(false)
    setSyncingUserId(null)
    setLibrarySyncError(!succeeded)
    return succeeded
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: isSupabaseConfigured,
      loading,
      syncing,
      syncingUserId,
      user,
      profile,
      profileError,
      librarySyncError,
      retryLibrarySync,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [loading, syncing, syncingUserId, user, profile, profileError, librarySyncError, signIn, signUp, signOut, refreshProfile, retryLibrarySync]
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
