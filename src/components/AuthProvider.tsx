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
import { authCallbackUrl } from '@/lib/authRedirects'

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
  signUp: (
    email: string,
    password: string,
    displayName?: string,
    nextPath?: string
  ) => Promise<AuthResult>
  signOut: () => Promise<void>
  signOutEverywhere: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<AuthResult>
  updatePassword: (password: string) => Promise<AuthResult>
  resendConfirmation: (email: string) => Promise<AuthResult>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const friendlyAuthError = (message: string) => {
  if (/invalid login credentials/i.test(message)) return 'Incorrect email or password.'
  if (/email not confirmed/i.test(message)) return 'Please confirm your email before signing in.'
  if (/already registered|already been registered/i.test(message)) {
    return 'An account with this email already exists. Try signing in.'
  }
  if (/password should be at least/i.test(message)) {
    return 'Password must be at least 8 characters.'
  }
  if (/new password should be different/i.test(message)) {
    return 'Choose a password different from your current one.'
  }
  if (/token has expired|otp_expired|invalid or has expired|flow state/i.test(message)) {
    return 'This link has expired. Request a new one.'
  }
  if (/rate limit/i.test(message)) {
    return 'Too many requests. Please wait a moment and try again.'
  }
  if (/for security purposes.*reauthenticate|reauthentication/i.test(message)) {
    return 'Please sign in again before changing sensitive account settings.'
  }
  if (/invalid format|unable to validate email/i.test(message)) {
    return 'Enter a valid email address.'
  }
  if (/email address.*already/i.test(message)) {
    return 'That email is already attached to another account.'
  }
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
    return { error: error ? friendlyAuthError(error.message) : null }
  }, [])

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      displayName?: string,
      nextPath?: string
    ): Promise<AuthResult> => {
      const supabase = getSupabase()
      if (!supabase) return { error: 'Accounts are not configured on this deployment.' }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: displayName ? { display_name: displayName } : undefined,
          emailRedirectTo: authCallbackUrl(nextPath || '/account'),
        },
      })

      if (error) return { error: friendlyAuthError(error.message) }
      return { error: null, needsConfirmation: !data.session }
    },
    []
  )

  const resetAuthState = useCallback(() => {
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

  const signOut = useCallback(async () => {
    const supabase = getSupabase()
    if (!supabase) return

    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new Error('Unable to sign out. Please try again.')
    }
    resetAuthState()
  }, [resetAuthState])

  const signOutEverywhere = useCallback(async () => {
    const supabase = getSupabase()
    if (!supabase) return

    const { error } = await supabase.auth.signOut({ scope: 'global' })
    if (error) {
      throw new Error('Unable to sign out of all sessions. Please try again.')
    }
    resetAuthState()
  }, [resetAuthState])

  const requestPasswordReset = useCallback(async (email: string): Promise<AuthResult> => {
    const supabase = getSupabase()
    if (!supabase) return { error: 'Accounts are not configured on this deployment.' }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authCallbackUrl('/reset-password'),
    })

    return { error: error ? friendlyAuthError(error.message) : null }
  }, [])

  const updatePassword = useCallback(async (password: string): Promise<AuthResult> => {
    const supabase = getSupabase()
    if (!supabase) return { error: 'Accounts are not configured on this deployment.' }

    const { error } = await supabase.auth.updateUser({ password })
    return { error: error ? friendlyAuthError(error.message) : null }
  }, [])

  const resendConfirmation = useCallback(async (email: string): Promise<AuthResult> => {
    const supabase = getSupabase()
    if (!supabase) return { error: 'Accounts are not configured on this deployment.' }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: authCallbackUrl('/account') },
    })

    return { error: error ? friendlyAuthError(error.message) : null }
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
      signOutEverywhere,
      requestPasswordReset,
      updatePassword,
      resendConfirmation,
      refreshProfile,
    }),
    [loading, syncing, syncingUserId, user, profile, profileError, librarySyncError, signIn, signUp, signOut, signOutEverywhere, requestPasswordReset, updatePassword, resendConfirmation, refreshProfile, retryLibrarySync]
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
