-- CineHindi analytics: visitors, sessions, pageviews, admin overview
-- Tracking is cookieless on the client; the API sets first-party HttpOnly ids.

create table if not exists public.analytics_admins (
  email text primary key,
  created_at timestamptz not null default now()
);

insert into public.analytics_admins (email)
values ('animeit158@gmail.com')
on conflict (email) do nothing;

create table if not exists public.analytics_visitors (
  id uuid primary key,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  first_path text,
  first_referrer text,
  user_agent text,
  last_device text,
  last_country text
);

create index if not exists analytics_visitors_last_seen_idx
  on public.analytics_visitors (last_seen desc);
create index if not exists analytics_visitors_user_idx
  on public.analytics_visitors (user_id);

create table if not exists public.analytics_sessions (
  id uuid primary key,
  visitor_id uuid not null references public.analytics_visitors(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  started_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  page_views integer not null default 0,
  entry_path text,
  last_path text,
  referrer text,
  user_agent text,
  device text,
  country text
);

create index if not exists analytics_sessions_last_seen_idx
  on public.analytics_sessions (last_seen desc);
create index if not exists analytics_sessions_visitor_idx
  on public.analytics_sessions (visitor_id);
create index if not exists analytics_sessions_user_idx
  on public.analytics_sessions (user_id);

create table if not exists public.analytics_pageviews (
  id bigserial primary key,
  session_id uuid not null references public.analytics_sessions(id) on delete cascade,
  visitor_id uuid not null references public.analytics_visitors(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  path text not null,
  referrer text,
  created_at timestamptz not null default now()
);

create index if not exists analytics_pageviews_created_idx
  on public.analytics_pageviews (created_at desc);
create index if not exists analytics_pageviews_path_idx
  on public.analytics_pageviews (path);
create index if not exists analytics_pageviews_visitor_idx
  on public.analytics_pageviews (visitor_id);

alter table public.analytics_admins enable row level security;
alter table public.analytics_visitors enable row level security;
alter table public.analytics_sessions enable row level security;
alter table public.analytics_pageviews enable row level security;

revoke all on public.analytics_admins from anon, authenticated;
revoke all on public.analytics_visitors from anon, authenticated;
revoke all on public.analytics_sessions from anon, authenticated;
revoke all on public.analytics_pageviews from anon, authenticated;

create or replace function public.is_analytics_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.analytics_admins admin
    where lower(admin.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke execute on function public.is_analytics_admin() from public, anon, authenticated;

create or replace function public.track_analytics_event(
  p_event text,
  p_path text,
  p_referrer text,
  p_visitor_id uuid,
  p_session_id uuid,
  p_user_agent text,
  p_country text,
  p_device text
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_event text := lower(coalesce(p_event, 'heartbeat'));
  v_path text := left(coalesce(nullif(p_path, ''), '/'), 512);
  v_referrer text := nullif(left(coalesce(p_referrer, ''), 512), '');
  v_user_agent text := nullif(left(coalesce(p_user_agent, ''), 512), '');
  v_country text := nullif(upper(left(coalesce(p_country, ''), 2)), '');
  v_device text := lower(coalesce(nullif(p_device, ''), 'desktop'));
begin
  if p_visitor_id is null or p_session_id is null then
    return;
  end if;
  if v_event not in ('page_view', 'heartbeat') then
    return;
  end if;

  insert into public.analytics_visitors (
    id, first_seen, last_seen, user_id, first_path, first_referrer,
    user_agent, last_device, last_country
  )
  values (
    p_visitor_id, now(), now(), v_user_id, v_path, v_referrer,
    v_user_agent, v_device, v_country
  )
  on conflict (id) do update set
    last_seen = now(),
    user_id = coalesce(excluded.user_id, public.analytics_visitors.user_id),
    last_device = excluded.last_device,
    last_country = coalesce(excluded.last_country, public.analytics_visitors.last_country);

  insert into public.analytics_sessions (
    id, visitor_id, user_id, started_at, last_seen, page_views,
    entry_path, last_path, referrer, user_agent, device, country
  )
  values (
    p_session_id, p_visitor_id, v_user_id, now(), now(),
    case when v_event = 'page_view' then 1 else 0 end,
    v_path, v_path, v_referrer, v_user_agent, v_device, v_country
  )
  on conflict (id) do update set
    last_seen = now(),
    user_id = coalesce(excluded.user_id, public.analytics_sessions.user_id),
    page_views = public.analytics_sessions.page_views
      + case when v_event = 'page_view' then 1 else 0 end,
    last_path = excluded.last_path,
    device = excluded.device,
    country = coalesce(excluded.country, public.analytics_sessions.country);

  if v_event = 'page_view' then
    insert into public.analytics_pageviews (
      session_id, visitor_id, user_id, path, referrer
    )
    values (p_session_id, p_visitor_id, v_user_id, v_path, v_referrer);
  end if;
end;
$$;

grant execute on function public.track_analytics_event(
  text, text, text, uuid, uuid, text, text, text
) to anon, authenticated;

create or replace function public.analytics_overview()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_active_5m_total bigint;
  v_active_5m_auth bigint;
  v_active_5m_anon bigint;
  v_active_30m_total bigint;
  v_active_30m_auth bigint;
  v_active_30m_anon bigint;
  v_sessions_today bigint;
  v_pageviews_today bigint;
  v_result jsonb;
begin
  if not public.is_analytics_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  select count(distinct coalesce(user_id::text, visitor_id::text))
    into v_active_5m_total
    from public.analytics_sessions
    where last_seen > now() - interval '5 minutes';

  select count(distinct user_id)
    into v_active_5m_auth
    from public.analytics_sessions
    where user_id is not null and last_seen > now() - interval '5 minutes';

  select count(distinct visitor_id)
    into v_active_5m_anon
    from public.analytics_sessions
    where user_id is null and last_seen > now() - interval '5 minutes';

  select count(distinct coalesce(user_id::text, visitor_id::text))
    into v_active_30m_total
    from public.analytics_sessions
    where last_seen > now() - interval '30 minutes';

  select count(distinct user_id)
    into v_active_30m_auth
    from public.analytics_sessions
    where user_id is not null and last_seen > now() - interval '30 minutes';

  select count(distinct visitor_id)
    into v_active_30m_anon
    from public.analytics_sessions
    where user_id is null and last_seen > now() - interval '30 minutes';

  select count(*) into v_sessions_today
    from public.analytics_sessions
    where started_at >= date_trunc('day', now());

  select count(*) into v_pageviews_today
    from public.analytics_pageviews
    where created_at >= date_trunc('day', now());

  select jsonb_build_object(
    'generated_at', to_jsonb(now()),
    'total_accounts', (select count(*) from auth.users),
    'confirmed_accounts', (
      select count(*) from auth.users where email_confirmed_at is not null
    ),
    'total_profiles', (select count(*) from public.profiles),
    'active_5m', jsonb_build_object(
      'total', v_active_5m_total,
      'authenticated', v_active_5m_auth,
      'anonymous', v_active_5m_anon
    ),
    'active_30m', jsonb_build_object(
      'total', v_active_30m_total,
      'authenticated', v_active_30m_auth,
      'anonymous', v_active_30m_anon
    ),
    'visitors', jsonb_build_object(
      'total', (select count(*) from public.analytics_visitors),
      'registered', (
        select count(*) from public.analytics_visitors where user_id is not null
      ),
      'anonymous', (
        select count(*) from public.analytics_visitors where user_id is null
      )
    ),
    'today', jsonb_build_object(
      'sessions', v_sessions_today,
      'pageviews', v_pageviews_today,
      'pages_per_session', coalesce(
        round(v_pageviews_today::numeric / nullif(v_sessions_today, 0), 1),
        0
      )
    ),
    'signups', jsonb_build_object(
      'today', (
        select count(*) from auth.users where created_at >= date_trunc('day', now())
      ),
      'last_7_days', (
        select count(*) from auth.users where created_at >= now() - interval '7 days'
      )
    ),
    'hourly', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'hour', to_char(bucket, 'HH24'),
            'label', to_char(bucket, 'Mon DD HH24:00'),
            'users', coalesce(stats.users, 0),
            'views', coalesce(stats.views, 0)
          )
          order by bucket
        ),
        '[]'::jsonb
      )
      from generate_series(
        date_trunc('hour', now()) - interval '23 hours',
        date_trunc('hour', now()),
        interval '1 hour'
      ) as bucket
      left join lateral (
        select
          count(distinct visitor_id) as users,
          count(*) as views
        from public.analytics_pageviews pageview
        where pageview.created_at >= bucket
          and pageview.created_at < bucket + interval '1 hour'
      ) stats on true
    ),
    'top_pages', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'path', page.path,
            'views', page.views,
            'visitors', page.visitors
          )
          order by page.views desc
        ),
        '[]'::jsonb
      )
      from (
        select
          path,
          count(*) as views,
          count(distinct visitor_id) as visitors
        from public.analytics_pageviews
        where created_at >= now() - interval '7 days'
        group by path
        order by views desc
        limit 10
      ) page
    ),
    'top_referrers', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'host', referrer.host,
            'views', referrer.views,
            'visitors', referrer.visitors
          )
          order by referrer.views desc
        ),
        '[]'::jsonb
      )
      from (
        select
          host,
          count(*) as views,
          count(distinct visitor_id) as visitors
        from (
          select
            visitor_id,
            nullif(
              regexp_replace(referrer, '^https?://([^/]+).*$', '\1'),
              ''
            ) as host
          from public.analytics_pageviews
          where referrer is not null
            and created_at >= now() - interval '7 days'
        ) refs
        where host is not null
        group by host
        order by views desc
        limit 8
      ) referrer
    ),
    'countries', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'country', country,
            'visitors', visitors
          )
          order by visitors desc
        ),
        '[]'::jsonb
      )
      from (
        select
          country,
          count(distinct visitor_id) as visitors
        from public.analytics_sessions
        where country is not null
          and last_seen >= now() - interval '7 days'
        group by country
        order by visitors desc
        limit 8
      ) country_stats
    ),
    'devices', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'device', device,
            'visitors', visitors
          )
          order by visitors desc
        ),
        '[]'::jsonb
      )
      from (
        select
          coalesce(device, 'unknown') as device,
          count(distinct visitor_id) as visitors
        from public.analytics_sessions
        where last_seen >= now() - interval '7 days'
        group by device
        order by visitors desc
      ) device_stats
    ),
    'recent_signups', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'email', signup.email,
            'name', signup.name,
            'created_at', signup.created_at,
            'last_sign_in_at', signup.last_sign_in_at
          )
          order by signup.created_at desc
        ),
        '[]'::jsonb
      )
      from (
        select
          users.email,
          coalesce(
            profiles.display_name,
            users.raw_user_meta_data ->> 'display_name',
            split_part(users.email, '@', 1)
          ) as name,
          users.created_at,
          users.last_sign_in_at
        from (
          select id, email, raw_user_meta_data, created_at, last_sign_in_at
          from auth.users
          order by created_at desc
          limit 10
        ) users
        left join public.profiles profiles on profiles.id = users.id
      ) signup
    )
  ) into v_result;

  return v_result;
end;
$$;

revoke execute on function public.analytics_overview() from public, anon;
grant execute on function public.analytics_overview() to authenticated;
