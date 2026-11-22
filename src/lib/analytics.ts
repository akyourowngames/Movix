export interface AnalyticsActiveSplit {
  total: number
  authenticated: number
  anonymous: number
}

export interface AnalyticsHourlyPoint {
  hour: string
  label: string
  users: number
  views: number
}

export interface AnalyticsPageRow {
  path: string
  views: number
  visitors: number
}

export interface AnalyticsReferrerRow {
  host: string
  views: number
  visitors: number
}

export interface AnalyticsCountryRow {
  country: string
  visitors: number
}

export interface AnalyticsDeviceRow {
  device: string
  visitors: number
}

export interface AnalyticsSignupRow {
  email: string | null
  name: string | null
  created_at: string
  last_sign_in_at: string | null
}

export interface AnalyticsOverview {
  generated_at: string
  total_accounts: number
  confirmed_accounts: number
  total_profiles: number
  active_5m: AnalyticsActiveSplit
  active_30m: AnalyticsActiveSplit
  visitors: {
    total: number
    registered: number
    anonymous: number
  }
  today: {
    sessions: number
    pageviews: number
    pages_per_session: number
  }
  signups: {
    today: number
    last_7_days: number
  }
  hourly: AnalyticsHourlyPoint[]
  top_pages: AnalyticsPageRow[]
  top_referrers: AnalyticsReferrerRow[]
  countries: AnalyticsCountryRow[]
  devices: AnalyticsDeviceRow[]
  recent_signups: AnalyticsSignupRow[]
}

export const emptyAnalyticsOverview: AnalyticsOverview = {
  generated_at: new Date(0).toISOString(),
  total_accounts: 0,
  confirmed_accounts: 0,
  total_profiles: 0,
  active_5m: { total: 0, authenticated: 0, anonymous: 0 },
  active_30m: { total: 0, authenticated: 0, anonymous: 0 },
  visitors: { total: 0, registered: 0, anonymous: 0 },
  today: { sessions: 0, pageviews: 0, pages_per_session: 0 },
  signups: { today: 0, last_7_days: 0 },
  hourly: [],
  top_pages: [],
  top_referrers: [],
  countries: [],
  devices: [],
  recent_signups: [],
}
