'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Film, Loader2 } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

const safeNext = (value: string | null) =>
  value && value.startsWith('/') && !value.startsWith('//') ? value : '/'

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const isLogin = mode === 'login'
  const { configured, loading: authLoading, user, signIn, signUp } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const incoming = params.get('error')
    if (incoming) setError(incoming)
  }, [])

  useEffect(() => {
    if (!authLoading && user) {
      const params = new URLSearchParams(window.location.search)
      router.replace(safeNext(params.get('next')))
    }
  }, [authLoading, user, router])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)

    const params = new URLSearchParams(window.location.search)
    const next = safeNext(params.get('next'))

    const result = isLogin
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password, displayName.trim() || undefined)

    if (result.error) {
      setError(result.error)
      setSubmitting(false)
      return
    }

    if (result.needsConfirmation) {
      setInfo('Almost there — check your inbox and click the confirmation link to activate your account.')
      setSubmitting(false)
      return
    }

    router.push(next)
    router.refresh()
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background pt-28 pb-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[320px] w-[420px] rounded-full bg-red-500/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto w-full max-w-md px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl"
        >
          <Link href="/" className="mb-8 flex items-center justify-center gap-2">
            <Film className="h-7 w-7 text-primary" />
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text font-display text-2xl font-bold tracking-wider text-transparent">
              CineHindi
            </span>
          </Link>

          <h1 className="mb-2 text-center font-display text-3xl font-bold">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mb-8 text-center text-sm text-white/50">
            {isLogin
              ? 'Sign in to sync your watchlist, history and resume points.'
              : 'Keep track of what you watch and pick up exactly where you left off.'}
          </p>

          {!configured && (
            <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Accounts are not configured on this deployment. Add your Supabase environment variables to enable them.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="displayName" className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-white/40">
                  Display name
                </label>
                <input
                  id="displayName"
                  type="text"
                  autoComplete="name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Krish"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-primary/60 focus:bg-white/[0.07]"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-white/40">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-primary/60 focus:bg-white/[0.07]"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-white/40">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-primary/60 focus:bg-white/[0.07]"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {info && (
              <div className="flex items-start gap-2 rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{info}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !configured}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-black transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/50">
            {isLogin ? 'New to CineHindi?' : 'Already have an account?'}{' '}
            <Link
              href={isLogin ? '/signup' : '/login'}
              className="font-medium text-primary hover:text-primary/80"
            >
              {isLogin ? 'Create an account' : 'Sign in'}
            </Link>
          </p>
        </motion.div>

        <p className="mt-6 text-center text-xs text-white/30">
          Accounts are optional —{' '}
          <Link href="/" className="text-white/60 underline-offset-4 hover:text-white hover:underline">
            keep browsing as a guest
          </Link>
        </p>
      </div>
    </main>
  )
}
