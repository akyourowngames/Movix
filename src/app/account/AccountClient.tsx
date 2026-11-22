'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  MonitorSmartphone,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
} from 'lucide-react'
import { friendlyAuthError, useAuth } from '@/components/AuthProvider'
import { getSupabase } from '@/lib/supabase/client'
import { authCallbackUrl } from '@/lib/authRedirects'
import { removeAvatar, uploadAvatar } from '@/lib/avatar'
import { clearProfile } from '@/hooks/useLocalProfile'
import { detachUser } from '@/lib/cloud'

const inputClass =
  'h-12 w-full rounded-lg border border-white/15 bg-black/30 px-4 text-sm text-white outline-none transition-colors placeholder:text-white/40 hover:border-white/25 focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60'
const buttonClass =
  'flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background'
const secondaryButtonClass =
  'flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'

const formatDate = (value: string | undefined) => {
  if (!value) return null
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return null
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

type NoticeKind = 'error' | 'success' | 'info'

function Notice({ kind, children }: { kind: NoticeKind; children: React.ReactNode }) {
  const tone =
    kind === 'error'
      ? 'border-red-400/40 bg-red-950/50 text-red-100'
      : kind === 'success'
        ? 'border-emerald-400/40 bg-emerald-950/45 text-emerald-100'
        : 'border-white/10 bg-white/5 text-white/70'
  const Icon = kind === 'error' ? AlertCircle : kind === 'success' ? CheckCircle2 : ShieldCheck

  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className={`flex items-start gap-2 border p-3 text-sm ${tone}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="leading-5">{children}</div>
    </div>
  )
}

function Panel({
  id,
  title,
  description,
  children,
  danger = false,
}: {
  id: string
  title: string
  description?: string
  children: React.ReactNode
  danger?: boolean
}) {
  return (
    <section
      aria-labelledby={id}
      className={`rounded-2xl border p-5 sm:p-6 ${
        danger ? 'border-red-400/25 bg-red-950/10' : 'border-white/10 bg-white/[0.03]'
      }`}
    >
      <h2 id={id} className="font-display text-xl font-semibold tracking-tight text-white">
        {title}
      </h2>
      {description && <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

export default function AccountClient() {
  const router = useRouter()
  const {
    configured,
    loading,
    user,
    profile,
    refreshProfile,
    signOutEverywhere,
    updatePassword,
    resendConfirmation,
  } = useAuth()

  const [displayName, setDisplayName] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameMessage, setNameMessage] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const [newEmail, setNewEmail] = useState('')
  const [emailBusy, setEmailBusy] = useState(false)
  const [emailMessage, setEmailMessage] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [resendBusy, setResendBusy] = useState(false)

  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const [sessionBusy, setSessionBusy] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)

  const [confirmAction, setConfirmAction] = useState<'clear' | 'delete' | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [dangerBusy, setDangerBusy] = useState(false)
  const [dangerError, setDangerError] = useState<string | null>(null)
  const [dangerMessage, setDangerMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login?next=/account')
    }
  }, [loading, user, router])

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '')
  }, [profile?.display_name])

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-background pb-32 pt-24">
        <div className="page-shell max-w-4xl">
          <div className="h-24 w-24 animate-pulse rounded-full bg-white/5" />
          <div className="mt-6 h-8 w-56 animate-pulse rounded bg-white/5" />
          <div className="mt-10 space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-40 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        </div>
      </main>
    )
  }

  const displayNameValue =
    profile?.display_name || user.email?.split('@')[0] || 'Your account'
  const initials = displayNameValue
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const memberSince = formatDate(user.created_at)
  const emailVerified = Boolean(user.email_confirmed_at)
  const pendingEmail = user.new_email

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setAvatarBusy(true)
    setAvatarError(null)
    setAvatarMessage(null)

    try {
      await uploadAvatar({
        userId: user.id,
        file,
        previousUrl: profile?.avatar_url,
      })
      await refreshProfile()
      setAvatarMessage('Avatar updated.')
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'Could not upload that image.')
    } finally {
      setAvatarBusy(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const handleRemoveAvatar = async () => {
    setAvatarBusy(true)
    setAvatarError(null)
    setAvatarMessage(null)

    try {
      await removeAvatar({ userId: user.id, previousUrl: profile?.avatar_url })
      await refreshProfile()
      setAvatarMessage('Avatar removed.')
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'Could not remove your avatar.')
    } finally {
      setAvatarBusy(false)
    }
  }

  const handleNameSave = async (event: React.FormEvent) => {
    event.preventDefault()
    const nextName = displayName.trim()
    setNameError(null)
    setNameMessage(null)

    if (nextName.length < 2 || nextName.length > 40) {
      setNameError('Display name must be between 2 and 40 characters.')
      return
    }

    const supabase = getSupabase()
    if (!supabase) {
      setNameError('Accounts are not configured on this deployment.')
      return
    }

    setNameSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: nextName, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) throw new Error('Could not save your display name.')

      await supabase.auth.updateUser({ data: { display_name: nextName } })
      await refreshProfile()
      setNameMessage('Display name updated.')
    } catch (error) {
      setNameError(error instanceof Error ? error.message : 'Could not save your display name.')
    } finally {
      setNameSaving(false)
    }
  }

  const handleEmailChange = async (event: React.FormEvent) => {
    event.preventDefault()
    const nextEmail = newEmail.trim().toLowerCase()
    setEmailError(null)
    setEmailMessage(null)

    if (!nextEmail || nextEmail === user.email?.toLowerCase()) {
      setEmailError('Enter a different email address.')
      return
    }

    const supabase = getSupabase()
    if (!supabase) {
      setEmailError('Accounts are not configured on this deployment.')
      return
    }

    setEmailBusy(true)
    try {
      const { error } = await supabase.auth.updateUser(
        { email: nextEmail },
        { emailRedirectTo: authCallbackUrl('/account') }
      )

      if (error) {
        setEmailError(friendlyAuthError(error.message))
        return
      }

      setNewEmail('')
      setEmailMessage(
        `Confirmation sent to ${nextEmail}. Check that inbox (and your current address if secure email change is enabled).`
      )
    } catch {
      setEmailError('Could not start the email change. Check your connection and try again.')
    } finally {
      setEmailBusy(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!user.email) return
    setResendBusy(true)
    setEmailError(null)
    setEmailMessage(null)

    try {
      const result = await resendConfirmation(user.email)
      if (result.error) {
        setEmailError(result.error)
      } else {
        setEmailMessage('Confirmation email sent. Check your inbox and spam folder.')
      }
    } catch {
      setEmailError('Could not resend the confirmation email.')
    } finally {
      setResendBusy(false)
    }
  }

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault()
    setPasswordError(null)
    setPasswordMessage(null)

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return
    }
    if (password !== passwordConfirmation) {
      setPasswordError('Passwords do not match.')
      return
    }

    setPasswordBusy(true)
    try {
      const result = await updatePassword(password)
      if (result.error) {
        setPasswordError(result.error)
        return
      }
      setPassword('')
      setPasswordConfirmation('')
      setPasswordMessage('Password updated.')
    } catch {
      setPasswordError('Could not update your password. Please try again.')
    } finally {
      setPasswordBusy(false)
    }
  }

  const handleSignOutEverywhere = async () => {
    setSessionBusy(true)
    setSessionError(null)

    try {
      await signOutEverywhere()
      router.replace('/login')
      router.refresh()
    } catch (error) {
      setSessionError(
        error instanceof Error ? error.message : 'Could not sign out of all sessions.'
      )
      setSessionBusy(false)
    }
  }

  const openConfirmation = (action: 'clear' | 'delete') => {
    setConfirmAction(action)
    setConfirmText('')
    setDangerError(null)
    setDangerMessage(null)
  }

  const confirmWord = confirmAction === 'delete' ? 'DELETE' : 'CLEAR'

  const handleConfirmedDanger = async () => {
    if (confirmText !== confirmWord) return
    const supabase = getSupabase()
    if (!supabase) {
      setDangerError('Accounts are not configured on this deployment.')
      return
    }

    setDangerBusy(true)
    setDangerError(null)

    try {
      if (confirmAction === 'clear') {
        const results = await Promise.all([
          supabase.from('watch_history').delete().eq('user_id', user.id),
          supabase.from('watchlist').delete().eq('user_id', user.id),
          supabase.from('likes').delete().eq('user_id', user.id),
          supabase.from('playback').delete().eq('user_id', user.id),
        ])

        if (results.some((result) => result.error)) {
          throw new Error('Some library data could not be removed. Please try again.')
        }

        clearProfile()
        setDangerMessage('Your cloud library and local cache have been cleared.')
        setConfirmAction(null)
        setConfirmText('')
        return
      }

      const { data, error } = await supabase.functions.invoke('delete-account', {
        method: 'POST',
      })

      if (error || (data && typeof data === 'object' && 'error' in data)) {
        throw new Error('Account deletion failed. Please try again or contact support.')
      }

      detachUser()
      await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined)
      router.replace('/')
      router.refresh()
    } catch (error) {
      setDangerError(
        error instanceof Error ? error.message : 'That action could not be completed.'
      )
    } finally {
      setDangerBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-background pb-32 pt-24">
      <div className="page-shell max-w-4xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-primary/15">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-display text-2xl font-bold text-primary">{initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="eyebrow mb-1 text-primary">Account settings</p>
              <h1 className="truncate font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                {displayNameValue}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <span className="truncate">{user.email}</span>
                <span className="text-white/20">·</span>
                <span className={emailVerified ? 'text-emerald-300' : 'text-amber-300'}>
                  {emailVerified ? 'Verified' : 'Not verified'}
                </span>
                {memberSince && (
                  <>
                    <span className="text-white/20">·</span>
                    <span>Member since {memberSince}</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/profile" className={secondaryButtonClass}>
              <UserRound className="h-4 w-4" aria-hidden="true" />
              View library
            </Link>
            <Link
              href="/browse"
              className="flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
            >
              Browse titles
            </Link>
          </div>
        </div>

        {!configured && (
          <div className="mt-6">
            <Notice kind="error">
              Accounts are not configured on this deployment. Add the Supabase environment
              variables to enable them.
            </Notice>
          </div>
        )}

        <div className="mt-8 space-y-5">
          <Panel
            id="profile-section"
            title="Profile"
            description="How your name and avatar appear across CineHindi."
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="Current avatar" className="h-full w-full object-cover" />
                ) : (
                  <UserRound className="h-7 w-7 text-white/30" aria-hidden="true" />
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  id="avatar-upload"
                  onChange={handleAvatarChange}
                />
                <label
                  htmlFor="avatar-upload"
                  className={`${secondaryButtonClass} cursor-pointer`}
                  aria-disabled={avatarBusy}
                >
                  {avatarBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Upload className="h-4 w-4" aria-hidden="true" />
                  )}
                  Upload photo
                </label>
                {profile?.avatar_url && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={avatarBusy}
                    className={secondaryButtonClass}
                  >
                    Remove
                  </button>
                )}
                <span className="self-center text-xs text-white/35">
                  JPG, PNG or WebP · resized to 320px
                </span>
              </div>
            </div>

            {avatarError && (
              <div className="mt-4">
                <Notice kind="error">{avatarError}</Notice>
              </div>
            )}
            {avatarMessage && (
              <div className="mt-4">
                <Notice kind="success">{avatarMessage}</Notice>
              </div>
            )}

            <form onSubmit={handleNameSave} className="mt-6 space-y-3" autoComplete="off">
              <label htmlFor="display-name" className="block text-sm font-medium text-white/90">
                Display name
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="display-name"
                  name="displayName"
                  type="text"
                  maxLength={40}
                  autoComplete="off"
                  spellCheck={false}
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Your name"
                  className={inputClass}
                />
                <button
                  type="submit"
                  disabled={nameSaving}
                  className={`${buttonClass} sm:w-auto`}
                >
                  {nameSaving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  Save name
                </button>
              </div>
              {nameError && (
                <Notice kind="error">{nameError}</Notice>
              )}
              {nameMessage && (
                <Notice kind="success">{nameMessage}</Notice>
              )}
            </form>
          </Panel>

          <Panel
            id="email-section"
            title="Email & confirmation"
            description="Change the address on your account or resend a confirmation link."
          >
            <div className="space-y-4">
              <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{user.email}</p>
                  <p className="mt-0.5 text-xs text-white/40">
                    {emailVerified ? 'Confirmed' : 'Awaiting confirmation'}
                  </p>
                </div>
                {!emailVerified && user.email && (
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resendBusy}
                    className={secondaryButtonClass}
                  >
                    {resendBusy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    Resend confirmation
                  </button>
                )}
              </div>

              {pendingEmail && (
                <Notice kind="info">
                  Confirmation pending for <span className="font-medium">{pendingEmail}</span>.
                  Check that inbox (and your current one) to finish the change.
                </Notice>
              )}

              <form onSubmit={handleEmailChange} className="space-y-3" autoComplete="off">
                <label htmlFor="new-email" className="block text-sm font-medium text-white/90">
                  New email
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Mail
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
                      aria-hidden="true"
                    />
                    <input
                      id="new-email"
                      name="newEmail"
                      type="email"
                      inputMode="email"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      data-1p-ignore="true"
                      data-lpignore="true"
                      value={newEmail}
                      onChange={(event) => setNewEmail(event.target.value)}
                      placeholder="new@example.com"
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={emailBusy || !newEmail.trim()}
                    className={buttonClass}
                  >
                    {emailBusy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    Send confirmation
                  </button>
                </div>
                <p className="text-xs leading-5 text-white/35">
                  Supabase may ask you to confirm from both the old and new address before the
                  change takes effect.
                </p>
                {emailError && <Notice kind="error">{emailError}</Notice>}
                {emailMessage && <Notice kind="success">{emailMessage}</Notice>}
              </form>
            </div>
          </Panel>

          <Panel
            id="password-section"
            title="Password"
            description="Choose a new password. You stay signed in on this device."
          >
            <form onSubmit={handlePasswordChange} className="space-y-3" autoComplete="off">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="account-password" className="mb-2 block text-sm font-medium text-white/90">
                    New password
                  </label>
                  <div className="relative">
                    <KeyRound
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
                      aria-hidden="true"
                    />
                    <input
                      id="account-password"
                      name="new-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      data-1p-ignore="true"
                      data-lpignore="true"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="At least 8 characters"
                      className={`${inputClass} pl-11 pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="absolute inset-y-0 right-0 inline-flex min-h-12 min-w-12 items-center justify-center text-white/40 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="account-password-confirm"
                    className="mb-2 block text-sm font-medium text-white/90"
                  >
                    Confirm password
                  </label>
                  <input
                    id="account-password-confirm"
                    name="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    data-1p-ignore="true"
                    data-lpignore="true"
                    value={passwordConfirmation}
                    onChange={(event) => setPasswordConfirmation(event.target.value)}
                    placeholder="Repeat password"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={passwordBusy} className={buttonClass}>
                  {passwordBusy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  Update password
                </button>
                <span className="text-xs text-white/35">
                  Password must be at least 8 characters.
                </span>
              </div>
              {passwordError && <Notice kind="error">{passwordError}</Notice>}
              {passwordMessage && <Notice kind="success">{passwordMessage}</Notice>}
            </form>
          </Panel>

          <Panel
            id="session-section"
            title="Sessions"
            description="Sign out of CineHindi on every device, including this one."
          >
            <button
              type="button"
              onClick={handleSignOutEverywhere}
              disabled={sessionBusy}
              className={secondaryButtonClass}
            >
              {sessionBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <LogOut className="h-4 w-4" aria-hidden="true" />
              )}
              Sign out of all devices
            </button>
            {sessionError && (
              <div className="mt-3">
                <Notice kind="error">{sessionError}</Notice>
              </div>
            )}
          </Panel>

          <Panel
            id="data-section"
            title="Data & account"
            description="Clear your library or permanently delete your account."
            danger
          >
            <div className="space-y-4">
              <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Clear library</p>
                  <p className="mt-0.5 text-xs text-white/40">
                    Removes watch history, watchlist, favorites and resume points.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openConfirmation('clear')}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-400/15"
                >
                  Clear library
                </button>
              </div>

              <div className="flex flex-col gap-3 rounded-xl border border-red-400/25 bg-red-950/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-red-100">Delete account</p>
                  <p className="mt-0.5 text-xs text-red-200/60">
                    Permanently deletes your profile, library, avatar and sign-in.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openConfirmation('delete')}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-400/50 bg-red-500/15 px-4 text-sm font-semibold text-red-100 transition-colors hover:bg-red-500/25"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete account
                </button>
              </div>

              {confirmAction && (
                <div className="rounded-xl border border-red-400/30 bg-red-950/25 p-4">
                  <p className="text-sm text-red-100">
                    Type <span className="font-mono font-bold">{confirmWord}</span> to{' '}
                    {confirmAction === 'delete' ? 'delete your account' : 'clear your library'}.
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(event) => setConfirmText(event.target.value)}
                      aria-label={`Type ${confirmWord} to confirm`}
                      placeholder={confirmWord}
                      autoComplete="off"
                      className={`${inputClass} sm:flex-1`}
                    />
                    <button
                      type="button"
                      onClick={handleConfirmedDanger}
                      disabled={dangerBusy || confirmText !== confirmWord}
                      className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {dangerBusy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                      {confirmAction === 'delete' ? 'Delete permanently' : 'Clear data'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmAction(null)
                        setConfirmText('')
                        setDangerError(null)
                      }}
                      className={secondaryButtonClass}
                    >
                      Cancel
                    </button>
                  </div>
                  {dangerError && (
                    <div className="mt-3">
                      <Notice kind="error">{dangerError}</Notice>
                    </div>
                  )}
                </div>
              )}

              {dangerMessage && <Notice kind="success">{dangerMessage}</Notice>}

              <div className="flex items-center gap-2 text-[11px] text-white/30">
                <MonitorSmartphone className="h-3.5 w-3.5" aria-hidden="true" />
                Account deletion also revokes all active sessions.
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </main>
  )
}
