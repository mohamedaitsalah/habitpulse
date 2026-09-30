-- ============================================================================
-- HabitPulse — production schema (PostgreSQL / Supabase)
-- ============================================================================
-- Every user-owned table carries user_id and is protected by Row Level
-- Security using auth.uid(). No customer can ever read or write another
-- customer's habits, tasks, mindset entries, goals or settings.
--
-- Run this once in the Supabase SQL editor.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- profiles --
create table if not exists public.profiles (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ------------------------------------------------------------------ habits --
create table if not exists public.habits (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  name           text not null,
  color          text not null default '#28D0C0',
  frequency_type text not null default 'daily'
                 check (frequency_type in ('daily','weekly','monthly')),
  selected_days  jsonb not null default '[]'::jsonb,   -- [0..6]
  start_date     date not null default current_date,
  end_date       date,
  category       text,
  archived       boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists habits_user_idx on public.habits(user_id);

-- ------------------------------------------------------- habit_completions --
create table if not exists public.habit_completions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  habit_id        uuid not null references public.habits(id) on delete cascade,
  completion_date date not null,
  created_at      timestamptz not null default now(),
  -- one completion per user + habit + day
  constraint habit_completions_unique unique (user_id, habit_id, completion_date)
);
create index if not exists completions_user_date_idx
  on public.habit_completions(user_id, completion_date);

-- ------------------------------------------------------------------- tasks --
create table if not exists public.tasks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null,
  task_date  date not null,
  completed  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tasks_user_date_idx on public.tasks(user_id, task_date);

-- ---------------------------------------------------------- mindset_entries --
create table if not exists public.mindset_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  energy     int not null default 0 check (energy between 0 and 10),
  focus      int not null default 0 check (focus between 0 and 10),
  motivation int not null default 0 check (motivation between 0 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- one entry per user per day
  constraint mindset_entries_unique unique (user_id, entry_date)
);

-- ------------------------------------------------------------------- goals --
create table if not exists public.goals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  life_area    text not null,
  status       text not null default 'IN PROGRESS',
  progress     int not null default 0 check (progress between 0 and 100),
  start_date   date not null default current_date,
  target_date  date,
  pinned       boolean not null default false,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists goals_user_idx on public.goals(user_id);

-- -------------------------------------------------------- user_preferences --
create table if not exists public.user_preferences (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users(id) on delete cascade,
  settings   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- updated_at trigger
-- ============================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['habits','tasks','mindset_entries','goals',
                           'profiles','user_preferences']
  loop
    execute format('drop trigger if exists touch_%1$s on public.%1$s', t);
    execute format(
      'create trigger touch_%1$s before update on public.%1$s
       for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- ============================================================================
-- ROW LEVEL SECURITY — ownership enforced by the database, not the frontend
-- ============================================================================
alter table public.profiles          enable row level security;
alter table public.habits            enable row level security;
alter table public.habit_completions enable row level security;
alter table public.tasks             enable row level security;
alter table public.mindset_entries   enable row level security;
alter table public.goals             enable row level security;
alter table public.user_preferences  enable row level security;

-- Auto-provision a profile + preferences row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  on conflict (user_id) do nothing;

  insert into public.user_preferences (user_id, settings)
  values (new.id, '{"theme":"dark","weekStartsOn":0}'::jsonb)
  on conflict (user_id) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Generic ownership policies: auth.uid() must match row.user_id
do $$
declare t text;
begin
  foreach t in array array['habits','habit_completions','tasks',
                           'mindset_entries','goals','user_preferences','profiles']
  loop
    execute format('drop policy if exists %1$s_select on public.%1$s', t);
    execute format('drop policy if exists %1$s_insert on public.%1$s', t);
    execute format('drop policy if exists %1$s_update on public.%1$s', t);
    execute format('drop policy if exists %1$s_delete on public.%1$s', t);

    execute format(
      'create policy %1$s_select on public.%1$s for select to authenticated
         using (user_id = auth.uid())', t);
    execute format(
      'create policy %1$s_insert on public.%1$s for insert to authenticated
         with check (user_id = auth.uid())', t);
    execute format(
      'create policy %1$s_update on public.%1$s for update to authenticated
         using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format(
      'create policy %1$s_delete on public.%1$s for delete to authenticated
         using (user_id = auth.uid())', t);
  end loop;
end $$;

-- Extra guard: a completion row must belong to one of the user's own habits
drop policy if exists habit_completions_insert on public.habit_completions;
drop policy if exists habit_completions_habit_owner on public.habit_completions;
create policy habit_completions_habit_owner on public.habit_completions
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.habits h
                where h.id = habit_id and h.user_id = auth.uid())
  );

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Never expose the service-role key in frontend code. Only the anon key is
--    safe in the browser; RLS above is what actually protects the data.
-- 2. Point the app at this project with:
--      VITE_SUPABASE_URL=https://<project>.supabase.co
--      VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>
