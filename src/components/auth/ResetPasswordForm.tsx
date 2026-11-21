'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
} from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import AuthFlowShell from '@/components/auth/AuthFlowShell'

export default function ResetPasswordForm() {
  const { loading, user, configured, updatePassword } = useAuth()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const mismatch = confirmation.length > 0 && password !== confirmation

  const strength = useMemo(() => {
    if (!password) return 0
    let score = 0
    if (password.length >= 6) score += 1
    if (password.length >= 10) score += 1
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
    if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1
    return Math.min(score, 3)
  }, [password])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmation) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      const result = await updatePassword(password)
      if (result.error) {
        setError(result.error)
        return
      }
      setDone(true)
      setPassword('')
      setConfirmation('')
      window.setTimeout(() => router.replace('/account'), 1800)
    } catch {
      setError('Your password could not be updated. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthFlowShell
      eyebrow="Account recovery"
      title="Choose a new password"
      subtitle="Set a new password for your CineHindi account."
      footer={
        <Link
          href={user ? '/account' : '/login'}
          className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {user ? 'Go to account settings' : 'Back to sign in'}
        </Link>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-white/50" role="status">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Checking your reset link…
        </div>
      ) : !user ? (
        <div className="space-y-5">
          <div
            role="alert"
            className="flex items-start gap-2 border border-red-400/40 bg-red-950/50 p-3 text-sm text-red-100"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium">This reset link is invalid or expired.</p>
              <p className="mt-1">Request a fresh link and open it on the same device.</p>
            </div>
          </div>
          <Link
            href="/forgot-password"
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-black transition-colors hover:bg-amber-400"
          >
            Request a new link
          </Link>
        </div>
      ) : done ? (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-2 border border-emerald-400/40 bg-emerald-950/45 p-3 text-sm text-emerald-100"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium">Password updated</p>
            <p className="mt-1">Taking you to your account settings…</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
          <div>
            <label htmlFor="new-password" className="mb-2 block text-sm font-medium text-white/90">
              New password
            </label>
            <div className="group relative">
              <LockKeyhole
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35 transition-colors group-focus-within:text-primary"
                aria-hidden="true"
              />
              <input
                id="new-password"
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
                placeholder="At least 6 characters"
                className="h-12 w-full rounded-lg border border-white/15 bg-black/30 pl-11 pr-12 text-sm text-white outline-none transition-colors placeholder:text-white/40 hover:border-white/25 focus:border-primary focus:ring-2 focus:ring-primary/25"
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
            {password.length > 0 && (
              <div className="mt-2.5">
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  {[1, 2, 3, 4].map((segment) => (
                    <span
                      key={segment}
                      className={`h-1 flex-1 rounded-full ${
                        segment <= strength
                          ? strength <= 1
                            ? 'bg-red-400'
                            : strength === 2
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-white/45" aria-live="polite">
                  Password strength: {['Too short', 'Weak', 'Fair', 'Strong'][strength]}
                </p>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="mb-2 block text-sm font-medium text-white/90"
            >
              Confirm password
            </label>
            <input
              id="confirm-password"
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
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="Repeat the new password"
              aria-invalid={mismatch}
              className="h-12 w-full rounded-lg border border-white/15 bg-black/30 px-4 text-sm text-white outline-none transition-colors placeholder:text-white/40 hover:border-white/25 focus:border-primary focus:ring-2 focus:ring-primary/25"
            />
            {mismatch && (
              <p className="mt-1.5 text-xs text-red-300" role="alert">
                Passwords do not match.
              </p>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 border border-red-400/40 bg-red-950/50 p-3 text-sm text-red-100"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>{error}</p>
            </div>
          )}

          {!configured && (
            <div className="flex items-start gap-2 border border-amber-400/35 bg-amber-400/10 p-3 text-sm text-amber-100">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>Accounts are not configured on this deployment.</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || mismatch || !configured}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0c10]"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Update password
          </button>
        </form>
      )}
    </AuthFlowShell>
  )
}
