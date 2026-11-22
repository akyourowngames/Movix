-- Suppress duplicate pageviews from rapid reloads by the same visitor + path.
-- 10-second window; heartbeats still update presence without adding pageviews.

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
  v_count_pageview boolean := false;
begin
  if p_visitor_id is null or p_session_id is null then
    return;
  end if;
  if v_event not in ('page_view', 'heartbeat') then
    return;
  end if;

  if v_event = 'page_view' then
    select not exists (
      select 1
      from public.analytics_pageviews pageview
      where pageview.visitor_id = p_visitor_id
        and pageview.path = v_path
        and pageview.created_at > now() - interval '10 seconds'
    ) into v_count_pageview;
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
    case when v_count_pageview then 1 else 0 end,
    v_path, v_path, v_referrer, v_user_agent, v_device, v_country
  )
  on conflict (id) do update set
    last_seen = now(),
    user_id = coalesce(excluded.user_id, public.analytics_sessions.user_id),
    page_views = public.analytics_sessions.page_views
      + case when v_count_pageview then 1 else 0 end,
    last_path = excluded.last_path,
    device = excluded.device,
    country = coalesce(excluded.country, public.analytics_sessions.country);

  if v_count_pageview then
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
