import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Database, LockKeyhole, LogIn } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { AnalyticsOverview } from '@/lib/analytics'
import AnalyticsDashboard from './AnalyticsDashboard'

export const metadata: Metadata = {
  title: 'Analytics',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const Shell = ({ children }: { children: React.ReactNode }) => (
  <main className="min-h-screen bg-background pb-24 pt-28">
    <div className="page-shell max-w-6xl">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to CineHindi
      </Link>
      {children}
    </div>
  </main>
)

const Panel = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) => (
  <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-card p-6 shadow-2xl sm:p-8">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
      {icon}
    </div>
    <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
    <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">{children}</div>
  </div>
)

export default async function AnalyticsPage() {
  const supabase = createServerSupabaseClient()

  if (!supabase) {
    return (
      <Shell>
        <Panel icon={<Database className="h-6 w-6" />} title="Supabase is not configured">
          <p>Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to this deployment.</p>
        </Panel>
      </Shell>
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <Shell>
        <Panel icon={<LogIn className="h-6 w-6" />} title="Sign in required">
          <p>Analytics is available to the site owner only.</p>
          <Link
            href="/login?next=/admin/analytics"
            className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 font-semibold text-black transition-colors hover:bg-amber-400"
          >
            Sign in
          </Link>
        </Panel>
      </Shell>
    )
  }

  const { data, error } = await supabase.rpc('analytics_overview')

  if (error) {
    if (error.code === '42501' || /not_admin/i.test(error.message || '')) {
      const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        ? `https://supabase.com/dashboard/project/${
            new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0]
          }/sql/new`
        : 'https://supabase.com/dashboard'

      return (
        <Shell>
          <Panel icon={<LockKeyhole className="h-6 w-6" />} title="Admin access required">
            <p>
              You are signed in as <span className="text-white">{user.email}</span>, but this
              account is not an analytics admin.
            </p>
            <p>To grant access, run this once in the Supabase SQL editor:</p>
            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-amber-200">
{`insert into public.analytics_admins (email)
values ('${user.email || 'your@email.com'}')
on conflict (email) do nothing;`}
            </pre>
            <a
              href={adminUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center rounded-lg border border-white/15 px-4 font-medium text-white transition-colors hover:bg-white/5"
            >
              Open Supabase SQL editor
            </a>
          </Panel>
        </Shell>
      )
    }

    if (/does not exist|schema cache|PGRST202|42P01/i.test(error.message || '')) {
      return (
        <Shell>
          <Panel icon={<Database className="h-6 w-6" />} title="Analytics schema not installed">
            <p>
              Apply <span className="text-white">supabase/migrations/20261122000000_analytics.sql</span>{' '}
              to this Supabase project, then reload this page.
            </p>
          </Panel>
        </Shell>
      )
    }

    return (
      <Shell>
        <Panel icon={<Database className="h-6 w-6" />} title="Analytics unavailable">
          <p>Could not load analytics. Check the Supabase logs and try again.</p>
        </Panel>
      </Shell>
    )
  }

  return (
    <Shell>
      <AnalyticsDashboard
        initial={data as unknown as AnalyticsOverview}
        adminEmail={user.email || 'admin'}
      />
    </Shell>
  )
}
