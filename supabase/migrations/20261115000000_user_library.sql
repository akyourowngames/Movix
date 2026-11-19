-- CineHindi user library: profiles, watch history, watchlist, likes, resume points
-- Run in the Supabase SQL editor, or with `supabase db push`.

-- Profiles ------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger functions should never be callable through the REST API
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Watch history --------------------------------------------------------------
create table if not exists public.watch_history (
  user_id uuid not null references auth.users(id) on delete cascade,
  media_type text not null check (media_type in ('movie', 'tv')),
  tmdb_id integer not null,
  title text not null,
  poster_path text,
  genres integer[] not null default '{}',
  language text,
  watched_at timestamptz not null default now(),
  primary key (user_id, media_type, tmdb_id)
);

alter table public.watch_history enable row level security;
create policy "watch_history_select_own" on public.watch_history for select using (auth.uid() = user_id);
create policy "watch_history_insert_own" on public.watch_history for insert with check (auth.uid() = user_id);
create policy "watch_history_update_own" on public.watch_history for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "watch_history_delete_own" on public.watch_history for delete using (auth.uid() = user_id);

create index if not exists watch_history_user_recency_idx on public.watch_history (user_id, watched_at desc);

-- Watchlist ------------------------------------------------------------------
create table if not exists public.watchlist (
  user_id uuid not null references auth.users(id) on delete cascade,
  media_type text not null check (media_type in ('movie', 'tv')),
  tmdb_id integer not null,
  title text not null,
  poster_path text,
  genres integer[] not null default '{}',
  language text,
  added_at timestamptz not null default now(),
  primary key (user_id, media_type, tmdb_id)
);

alter table public.watchlist enable row level security;
create policy "watchlist_select_own" on public.watchlist for select using (auth.uid() = user_id);
create policy "watchlist_insert_own" on public.watchlist for insert with check (auth.uid() = user_id);
create policy "watchlist_update_own" on public.watchlist for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "watchlist_delete_own" on public.watchlist for delete using (auth.uid() = user_id);

create index if not exists watchlist_user_recency_idx on public.watchlist (user_id, added_at desc);

-- Likes / favorites ----------------------------------------------------------
create table if not exists public.likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  media_type text not null check (media_type in ('movie', 'tv')),
  tmdb_id integer not null,
  title text,
  poster_path text,
  genres integer[] not null default '{}',
  created_at timestamptz not null default now(),
  primary key (user_id, media_type, tmdb_id)
);

alter table public.likes enable row level security;
create policy "likes_select_own" on public.likes for select using (auth.uid() = user_id);
create policy "likes_insert_own" on public.likes for insert with check (auth.uid() = user_id);
create policy "likes_delete_own" on public.likes for delete using (auth.uid() = user_id);

create index if not exists likes_user_recency_idx on public.likes (user_id, created_at desc);

-- Resume points --------------------------------------------------------------
create table if not exists public.playback (
  user_id uuid not null references auth.users(id) on delete cascade,
  media_type text not null check (media_type in ('movie', 'tv')),
  tmdb_id integer not null,
  season integer,
  episode integer,
  title text,
  updated_at timestamptz not null default now(),
  primary key (user_id, media_type, tmdb_id)
);

alter table public.playback enable row level security;
create policy "playback_select_own" on public.playback for select using (auth.uid() = user_id);
create policy "playback_insert_own" on public.playback for insert with check (auth.uid() = user_id);
create policy "playback_update_own" on public.playback for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "playback_delete_own" on public.playback for delete using (auth.uid() = user_id);

create index if not exists playback_user_recency_idx on public.playback (user_id, updated_at desc);

-- PostgREST access for signed-in users (RLS still restricts rows) -------------
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.watch_history to authenticated;
grant select, insert, update, delete on public.watchlist to authenticated;
grant select, insert, update, delete on public.likes to authenticated;
grant select, insert, update, delete on public.playback to authenticated;
