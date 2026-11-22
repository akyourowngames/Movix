'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  CalendarDays,
  Clock3,
  Eye,
  Globe2,
  Link2,
  MonitorSmartphone,
  RefreshCw,
  UserCheck,
  UserRound,
  Users,
  UserX,
} from 'lucide-react'
import type { AnalyticsOverview } from '@/lib/analytics'

const number = new Intl.NumberFormat('en-IN')

const formatNumber = (value: number) => number.format(Number(value) || 0)

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return '—'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return '—'
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const StatCard = ({
  icon,
  label,
  value,
  detail,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  detail: string
  accent?: boolean
}) => (
  <div
    className={`rounded-2xl border p-4 sm:p-5 ${
      accent
        ? 'border-primary/30 bg-primary/[0.07] shadow-[0_0_40px_-18px_hsla(var(--primary)/0.65)]'
        : 'border-white/10 bg-card'
    }`}
  >
    <div className="mb-3 flex items-center justify-between gap-2">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className={accent ? 'text-primary' : 'text-muted-foreground'}>{icon}</span>
    </div>
    <div className="font-display text-3xl font-bold tabular-nums text-white">{value}</div>
    <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
  </div>
)

const EmptyRow = ({ label }: { label: string }) => (
  <p className="px-3 py-6 text-center text-sm text-muted-foreground">{label}</p>
)

export default function AnalyticsDashboard({
  initial,
  adminEmail,
}: {
  initial: AnalyticsOverview
  adminEmail: string
}) {
  const [data, setData] = useState(initial)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const response = await fetch('/api/admin/analytics', { cache: 'no-store' })
      if (!response.ok) throw new Error('Analytics refresh failed')
      const next = (await response.json()) as AnalyticsOverview
      setData(next)
      setError('')
    } catch {
      setError('Could not refresh right now. Showing the last snapshot.')
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, 30_000)
    return () => window.clearInterval(timer)
  }, [refresh])

  const hourly = data.hourly || []
  const maxHourlyUsers = Math.max(1, ...hourly.map((point) => point.users))
  const last24Users = hourly.reduce((sum, point) => sum + point.users, 0)
  const last24Views = hourly.reduce((sum, point) => sum + point.views, 0)

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Live audience
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Analytics
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Signed-in and anonymous activity, account growth, and page performance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right text-xs text-muted-foreground">
            <p className="text-white/80">{adminEmail}</p>
            <p>Updated {formatDateTime(data.generated_at)}</p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={refreshing}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <p className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          accent
          icon={<Activity className="h-5 w-5" />}
          label="Active now"
          value={formatNumber(data.active_5m.total)}
          detail={`${formatNumber(data.active_5m.authenticated)} signed in • ${formatNumber(
            data.active_5m.anonymous
          )} guests • 30m: ${formatNumber(data.active_30m.total)}`}
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Registered accounts"
          value={formatNumber(data.total_accounts)}
          detail={`${formatNumber(data.confirmed_accounts)} confirmed • ${formatNumber(
            data.total_profiles
          )} profiles`}
        />
        <StatCard
          icon={<UserX className="h-5 w-5" />}
          label="Anonymous visitors"
          value={formatNumber(data.visitors.anonymous)}
          detail={`${formatNumber(data.visitors.total)} unique visitors total`}
        />
        <StatCard
          icon={<Clock3 className="h-5 w-5" />}
          label="Sessions today"
          value={formatNumber(data.today.sessions)}
          detail={`${formatNumber(data.today.pageviews)} pageviews • ${formatNumber(
            data.today.pages_per_session
          )} pages/session`}
        />
        <StatCard
          icon={<Eye className="h-5 w-5" />}
          label="Pageviews today"
          value={formatNumber(data.today.pageviews)}
          detail="All tracked pages and titles"
        />
        <StatCard
          icon={<UserCheck className="h-5 w-5" />}
          label="Signups today"
          value={formatNumber(data.signups.today)}
          detail={`${formatNumber(data.signups.last_7_days)} in the last 7 days`}
        />
        <StatCard
          icon={<UserRound className="h-5 w-5" />}
          label="Returning visitors"
          value={formatNumber(data.visitors.registered)}
          detail={`${formatNumber(data.visitors.total)} total tracked visitors`}
        />
        <StatCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Active 30 minutes"
          value={formatNumber(data.active_30m.total)}
          detail={`${formatNumber(data.active_30m.authenticated)} signed in • ${formatNumber(
            data.active_30m.anonymous
          )} guests`}
        />
      </section>

      <section className="rounded-2xl border border-white/10 bg-card p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-white">Last 24 hours</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Unique visitors and pageviews by hour
            </p>
          </div>
          <div className="flex gap-5 text-xs text-muted-foreground">
            <span>
              <strong className="text-white">{formatNumber(last24Users)}</strong> visitor-hours
            </span>
            <span>
              <strong className="text-white">{formatNumber(last24Views)}</strong> views
            </span>
          </div>
        </div>
        <div className="flex h-44 items-end gap-1.5">
          {hourly.map((point, index) => (
            <div key={`${point.hour}-${index}`} className="group flex h-full min-w-0 flex-1 flex-col justify-end">
              <div
                title={`${point.label} — ${formatNumber(point.users)} visitors, ${formatNumber(
                  point.views
                )} views`}
                className="min-h-1 w-full rounded-t bg-primary/70 transition-colors group-hover:bg-primary"
                style={{ height: `${Math.max(3, (point.users / maxHourlyUsers) * 100)}%` }}
              />
            </div>
          ))}
        </div>
        <div
          className="mt-2 grid gap-1.5 text-[10px] text-muted-foreground"
          style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}
        >
          {hourly.map((point, index) => (
            <span key={`${point.hour}-label-${index}`} className="text-center">
              {index % 4 === 0 ? point.hour : ''}
            </span>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-card">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="font-display text-lg font-bold text-white">Top pages</h2>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </div>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </div>
          {data.top_pages.length === 0 ? (
            <EmptyRow label="No pageviews tracked yet." />
          ) : (
            <div className="divide-y divide-white/5">
              {data.top_pages.map((page) => (
                <div key={page.path} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-xs text-white/85" title={page.path}>
                      {page.path}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-semibold tabular-nums text-white">{formatNumber(page.views)}</p>
                    <p className="text-muted-foreground">{formatNumber(page.visitors)} visitors</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-card">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="font-display text-lg font-bold text-white">Recent signups</h2>
              <p className="text-xs text-muted-foreground">Newest accounts</p>
            </div>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </div>
          {data.recent_signups.length === 0 ? (
            <EmptyRow label="No accounts yet." />
          ) : (
            <div className="divide-y divide-white/5">
              {data.recent_signups.map((signup, index) => (
                <div key={`${signup.email || 'user'}-${index}`} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {(signup.name || signup.email || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {signup.name || 'Unnamed user'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{signup.email || 'No email'}</p>
                  </div>
                  <p className="shrink-0 text-right text-[11px] text-muted-foreground">
                    {formatDateTime(signup.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-card">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="font-display text-lg font-bold text-white">Traffic sources</h2>
              <p className="text-xs text-muted-foreground">Referrers, last 7 days</p>
            </div>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </div>
          {data.top_referrers.length === 0 ? (
            <EmptyRow label="No referrers tracked yet." />
          ) : (
            <div className="divide-y divide-white/5">
              {data.top_referrers.map((referrer) => (
                <div key={referrer.host} className="flex items-center justify-between gap-3 px-5 py-3">
                  <span className="truncate text-sm text-white/85">{referrer.host}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {formatNumber(referrer.visitors)} visitors · {formatNumber(referrer.views)} views
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-card">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="font-display text-lg font-bold text-white">Audience</h2>
              <p className="text-xs text-muted-foreground">Countries and devices, last 7 days</p>
            </div>
            <Globe2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <div>
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Globe2 className="h-3.5 w-3.5" /> Countries
              </p>
              {data.countries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No country data yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.countries.map((country) => (
                    <div key={country.country} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-white/80">{country.country}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatNumber(country.visitors)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <MonitorSmartphone className="h-3.5 w-3.5" /> Devices
              </p>
              {data.devices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No device data yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.devices.map((device) => (
                    <div key={device.device} className="flex items-center justify-between gap-3 text-sm">
                      <span className="capitalize text-white/80">{device.device}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatNumber(device.visitors)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Anonymous visitors are tracked with a first-party, HttpOnly visitor id. No raw IP addresses
        are stored. Admin and bot traffic is excluded.
      </p>
    </div>
  )
}
