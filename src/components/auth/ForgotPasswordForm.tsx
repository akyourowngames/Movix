'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Loader2, Mail } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import AuthFlowShell from '@/components/auth/AuthFlowShell'

export default function ForgotPasswordForm() {
  const { configured, requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const result = await requestPasswordReset(email.trim())
      if (result.error) {
        setError(result.error)
        return
      }
      setSent(true)
    } catch {
      setError('We could not send the reset link. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthFlowShell
      eyebrow="Account recovery"
      title="Reset your password"
      subtitle="Enter the email on your account and we’ll send a secure reset link."
      footer={
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="space-y-5">
          <div
            role="status"
            aria-live="polite"
            className="flex items-start gap-2 border border-emerald-400/40 bg-emerald-950/45 p-3 text-sm text-emerald-100"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium">Check your inbox</p>
              <p className="mt-1">
                If an account exists for <span className="font-medium">{email}</span>, a reset
                link is on its way. Check spam too.
              </p>
            </div>
          </div>
          <p className="text-xs leading-5 text-white/40">
            The link expires after a short time. Supabase’s default email sender is rate-limited,
            so wait a moment before requesting another.
          </p>
          <button
            type="button"
            onClick={() => {
              setSent(false)
              setError(null)
            }}
            className="min-h-11 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
          <div>
            <label htmlFor="reset-email" className="mb-2 block text-sm font-medium text-white/90">
              Email
            </label>
            <div className="group relative">
              <Mail
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35 transition-colors group-focus-within:text-primary"
                aria-hidden="true"
              />
              <input
                id="reset-email"
                name="email"
                type="email"
                inputMode="email"
                required
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                data-1p-ignore="true"
                data-lpignore="true"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                className="h-12 w-full rounded-lg border border-white/15 bg-black/30 pl-11 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/40 hover:border-white/25 focus:border-primary focus:ring-2 focus:ring-primary/25"
              />
            </div>
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
            disabled={submitting || !configured}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0c10]"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Send reset link
          </button>
        </form>
      )}
    </AuthFlowShell>
  )
}
