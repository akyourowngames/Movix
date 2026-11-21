'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Ticket,
  UserRound,
} from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { AuthBackdrop, AuthMobileIntro, AuthStage, type AuthMode } from '@/components/auth/AuthArtwork'

const safeNext = (value: string | null) => {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return '/'
  }

  const nextUrl = new URL(value, window.location.origin)
  if (nextUrl.origin !== window.location.origin) return '/'

  return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`
}

const STRENGTH_LABELS = ['Too short', 'Weak', 'Fair', 'Strong'] as const

const strengthTone = (score: number) => {
  if (score <= 1) return 'bg-red-400'
  if (score === 2) return 'bg-amber-400'
  return 'bg-emerald-400'
}

function FieldLabel({
  htmlFor,
  index,
  children,
}: {
  htmlFor: string
  index: number
  children: React.ReactNode
}) {
  return (
    <label htmlFor={htmlFor} className="mb-2 flex items-center gap-2 text-sm font-medium text-white/90">
      <span
        aria-hidden="true"
        className="font-mono text-[10px] tabular-nums tracking-[0.18em] text-white/30"
      >
        {String(index).padStart(2, '0')}
      </span>
      {children}
    </label>
  )
}

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const isLogin = mode === 'login'
  const { configured, loading: authLoading, user, signIn, signUp, resendConfirmation } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [nextPath, setNextPath] = useState('/')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const incoming = params.get('error')
    if (incoming) setError(incoming)
    setNextPath(safeNext(params.get('next')))
  }, [mode])

  useEffect(() => {
    if (!authLoading && user) {
      const params = new URLSearchParams(window.location.search)
      router.replace(safeNext(params.get('next')))
    }
  }, [authLoading, user, router])

  const hrefFor = (target: AuthMode) => {
    const base = target === 'login' ? '/login' : '/signup'
    return nextPath === '/' ? base : `${base}?next=${encodeURIComponent(nextPath)}`
  }

  const strength = useMemo(() => {
    if (!password) return 0
    let score = 0
    if (password.length >= 6) score += 1
    if (password.length >= 10) score += 1
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
    if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1
    return Math.min(score, 3)
  }, [password])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)

    const params = new URLSearchParams(window.location.search)
    const next = safeNext(params.get('next'))

    try {
      const result = isLogin
        ? await signIn(email.trim(), password)
        : await signUp(
            email.trim(),
            password,
            displayName.trim() || undefined,
            nextPath
          )

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.needsConfirmation) {
        setInfo(
          'Almost there — check your inbox and click the confirmation link to activate your account.'
        )
        return
      }

      router.push(next)
      router.refresh()
    } catch {
      setError('We could not complete your request. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const emailIndex = isLogin ? 1 : 2
  const passwordIndex = isLogin ? 2 : 3

  const handleResendConfirmation = async () => {
    if (!email.trim()) {
      setError('Enter your email above first.')
      return
    }

    setResending(true)
    setError(null)
    setInfo(null)
    const result = await resendConfirmation(email.trim())
    setResending(false)

    if (result.error) {
      setError(result.error)
    } else {
      setInfo('Confirmation email sent. Check your inbox and spam folder.')
    }
  }

  const fieldClass =
    'h-12 w-full rounded-lg border border-white/15 bg-black/30 pl-11 text-sm text-white outline-none transition-colors placeholder:text-white/40 hover:border-white/25 focus:border-primary focus:ring-2 focus:ring-primary/25'
  const inputClass = `${fieldClass} pr-4`
  const passwordInputClass = `${fieldClass} pr-12`
  const noAutofill = {
    autoComplete: 'off',
    autoCorrect: 'off',
    autoCapitalize: 'none' as const,
    spellCheck: false,
    'data-1p-ignore': 'true',
    'data-lpignore': 'true',
    'data-bwignore': 'true',
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1600px] flex-col lg:grid lg:grid-cols-[1.06fr_0.94fr]">
        <section className="hidden lg:block">
          <AuthStage mode={mode} />
        </section>

        <section className="relative flex min-h-dvh flex-col">
          <AuthBackdrop />

          <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[500px] flex-1 flex-col px-3 pb-6 pt-5 sm:px-6 sm:pb-10 lg:justify-center lg:px-10 lg:pb-14">
            <AuthMobileIntro mode={mode} />

            <div className="my-auto w-full py-6 lg:my-0 lg:py-0">
              <div className="mb-3 hidden items-center justify-between px-1 lg:flex">
                <Link
                  href="/"
                  className="inline-flex min-h-11 items-center gap-2 text-sm text-white/55 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back to browsing
                </Link>
                <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-white/30">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary/70" aria-hidden="true" />
                  Secure access
                </span>
              </div>

              {/* Cinema ticket */}
              <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0b0c10] shadow-[0_40px_110px_-45px_rgba(0,0,0,0.98)]">
              <div className="flex items-center justify-between gap-3 border-b border-dashed border-white/10 bg-white/[0.025] px-4 py-3 sm:px-6">
                <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                  <Ticket className="h-3.5 w-3.5" aria-hidden="true" />
                  CineHindi · Admit one
                </span>
                <span className="truncate text-[10px] uppercase tracking-[0.16em] text-white/30">
                  {isLogin ? 'Returning guest' : 'New guest'}
                </span>
              </div>

              <div className="px-4 pb-7 pt-6 sm:px-6">
                <nav
                  aria-label="Choose sign in or create account"
                  className="mb-6 flex items-center gap-2 border-b border-white/10 text-sm"
                >
                  <Link
                    href={hrefFor('login')}
                    aria-current={isLogin ? 'page' : undefined}
                    className={`relative -mb-px flex min-h-11 items-center border-b-2 px-1 pb-2.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      isLogin
                        ? 'border-primary text-white'
                        : 'border-transparent text-white/45 hover:text-white'
                    }`}
                  >
                    Sign in
                  </Link>
                  <span className="text-white/15" aria-hidden="true">
                    /
                  </span>
                  <Link
                    href={hrefFor('signup')}
                    aria-current={!isLogin ? 'page' : undefined}
                    className={`relative -mb-px flex min-h-11 items-center border-b-2 px-1 pb-2.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      !isLogin
                        ? 'border-primary text-white'
                        : 'border-transparent text-white/45 hover:text-white'
                    }`}
                  >
                    Join CineHindi
                  </Link>
                </nav>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  <h1 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    {isLogin ? 'Welcome back' : 'Create your account'}
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {isLogin
                      ? 'Sign in to continue your collection across every device.'
                      : 'Create your library once. Keep it everywhere you watch.'}
                  </p>
                </motion.div>

                {!configured && (
                  <div className="mt-6 flex items-start gap-2 border border-amber-400/35 bg-amber-400/10 p-3 text-sm text-amber-100">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <p>
                      Accounts are not configured on this deployment. Add your Supabase
                      environment variables to enable them.
                    </p>
                  </div>
                )}

                <form
                  onSubmit={handleSubmit}
                  className="mt-6 space-y-5"
                  aria-busy={submitting}
                  autoComplete="off"
                >
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <FieldLabel htmlFor="displayName" index={1}>
                        Display name
                      </FieldLabel>
                      <div className="group relative">
                        <UserRound
                          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35 transition-colors group-focus-within:text-primary"
                          aria-hidden="true"
                        />
                        <input
                          id="displayName"
                          name="displayName"
                          type="text"
                          {...noAutofill}
                          value={displayName}
                          onChange={(event) => setDisplayName(event.target.value)}
                          placeholder="Your name"
                          className={inputClass}
                        />
                      </div>
                    </motion.div>
                  )}

                  <div>
                    <FieldLabel htmlFor="email" index={emailIndex}>
                      Email
                    </FieldLabel>
                    <div className="group relative">
                      <Mail
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35 transition-colors group-focus-within:text-primary"
                        aria-hidden="true"
                      />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        inputMode="email"
                        required
                        {...noAutofill}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="name@example.com"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <FieldLabel htmlFor="password" index={passwordIndex}>
                      Password
                    </FieldLabel>
                    <div className="group relative">
                      <LockKeyhole
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35 transition-colors group-focus-within:text-primary"
                        aria-hidden="true"
                      />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        {...noAutofill}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder={isLogin ? 'Enter your password' : 'At least 6 characters'}
                        aria-describedby={!isLogin && password ? 'password-strength' : undefined}
                        className={passwordInputClass}
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

                    {!isLogin && password.length > 0 && (
                      <div className="mt-2.5" id="password-strength">
                        <div className="flex items-center gap-1.5" aria-hidden="true">
                          {[1, 2, 3, 4].map((segment) => (
                            <span
                              key={segment}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                segment <= strength
                                  ? strengthTone(strength)
                                  : 'bg-white/10'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="mt-1.5 text-xs text-white/45" aria-live="polite">
                          Password strength: {STRENGTH_LABELS[strength]}
                        </p>
                      </div>
                    )}

                    {isLogin && (
                      <div className="mt-2 flex justify-end">
                        <Link
                          href="/forgot-password"
                          className="inline-flex min-h-9 items-center text-xs font-medium text-white/55 underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          Forgot password?
                        </Link>
                      </div>
                    )}
                  </div>

                  <AnimatePresence initial={false}>
                    {error && (
                      <motion.div
                        key="error"
                        role="alert"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex items-start gap-2 border border-red-400/40 bg-red-950/50 p-3 text-sm text-red-100"
                      >
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <p>{error}</p>
                      </motion.div>
                    )}

                    {info && (
                      <motion.div
                        key="info"
                        role="status"
                        aria-live="polite"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex items-start gap-2 border border-emerald-400/40 bg-emerald-950/45 p-3 text-sm text-emerald-100"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <p>{info}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {isLogin && error && /confirm your email/i.test(error) && (
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={resending}
                      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary/35 bg-primary/10 px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {resending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                      Resend confirmation email
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !configured}
                    className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-black transition-all hover:bg-amber-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0c10] motion-reduce:transition-none"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Please wait…
                      </>
                    ) : (
                      <>
                        {isLogin ? 'Sign in' : 'Create account'}
                        <ArrowRight
                          className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                          aria-hidden="true"
                        />
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Ticket stub */}
              <div className="relative border-t border-dashed border-white/15">
                <span
                  aria-hidden="true"
                  className="absolute -left-3 -top-3 h-6 w-6 rounded-full border border-white/10 bg-[#050507] shadow-[inset_0_1px_4px_rgba(0,0,0,0.9)]"
                />
                <span
                  aria-hidden="true"
                  className="absolute -right-3 -top-3 h-6 w-6 rounded-full border border-white/10 bg-[#050507] shadow-[inset_0_1px_4px_rgba(0,0,0,0.9)]"
                />
                <div
                  aria-hidden="true"
                  className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-20 opacity-45"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(90deg, rgba(255,255,255,0.8) 0 1px, transparent 1px 4px)',
                      }}
                    />
                    <div className="text-[9px] uppercase leading-4 tracking-[0.18em] text-white/30">
                      <p>Screen 01 · Row C</p>
                      <p className="text-white/20">Admit one</p>
                    </div>
                  </div>
                  <p className="hidden text-[9px] uppercase tracking-[0.18em] text-white/25 sm:block">
                    CineHindi · No. 0117
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-4 flex items-center justify-center gap-2 text-[11px] text-white/35">
              <ShieldCheck className="h-3.5 w-3.5 text-primary/70" aria-hidden="true" />
              Your account and watch history stay private.
            </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
