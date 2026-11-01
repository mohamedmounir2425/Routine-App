-- Baseline plus additive sync fields, captured from LifeOS on 2026-11-01.
-- No user data is removed. Auth schema is supplied by Supabase.

create table if not exists public.profiles (
  "id" uuid not null primary key references auth.users(id) on delete cascade,
  "user_name" text default 'بطل الروتين'::text,
  "theme" text default 'dark'::text,
  "active_plan_type" text default '4-weeks'::text,
  "current_week_number" int4 default 1,
  "current_level_number" int4 default 1,
  "sound_beeps_enabled" bool default true,
  "voice_coach_enabled" bool default true,
  "voice_language" text default 'ar'::text,
  "default_rest_seconds" int4 default 20,
  "reminder_enabled" bool default false,
  "reminder_time" text default '18:30'::text,
  "reminder_days" jsonb default '[6, 1, 3, 4]'::jsonb,
  "work_break_reminder_enabled" bool default false,
  "work_break_interval_minutes" int4 default 45,
  "screen_wake_lock" bool default true,
  "workout_video_autoplay" bool default true,
  "workout_video_muted" bool default true,
  "workout_video_loop" bool default true,
  "workout_default_view_mode" text default 'video'::text,
  "enabled_spaces" jsonb default '["worship", "health", "work", "plans"]'::jsonb,
  "has_completed_onboarding" bool default true,
  "updated_at" timestamptz default now()
);

create table if not exists public.workout_logs (
  "id" text not null primary key,
  "user_id" uuid not null references auth.users(id) on delete cascade,
  "routine_id" text not null,
  "routine_name" text not null,
  "completed_at" timestamptz not null,
  "duration_minutes" int4 default 0,
  "exercises_completed" int4 default 0,
  "total_exercises" int4 default 0,
  "week_number" int4,
  "session_code" text,
  "pre_pain_score" int4,
  "post_pain_score" int4,
  "difficulty_rating" text,
  "notes" text,
  "created_at" timestamptz default now()
);

create table if not exists public.custom_routines (
  "id" text not null primary key,
  "user_id" uuid not null references auth.users(id) on delete cascade,
  "name" text not null,
  "description" text,
  "exercise_ids" jsonb not null default '[]'::jsonb,
  "total_estimated_minutes" int4 default 10,
  "level" text default 'gentle'::text,
  "tag" text default 'تمرين مخصص'::text,
  "custom_exercise_configs" jsonb,
  "created_at" timestamptz default now()
);

create table if not exists public.weekly_schedule (
  "id" text not null primary key,
  "user_id" uuid not null references auth.users(id) on delete cascade,
  "day_of_week" int4 not null,
  "day_name_ar" text not null,
  "routine_id" text,
  "is_rest_day" bool default false,
  "rest_reason" text,
  "session_code" text,
  "week_number" int4,
  "updated_at" timestamptz default now()
);

create table if not exists public.azkar_logs (
  "id" text not null primary key,
  "user_id" uuid not null references auth.users(id) on delete cascade,
  "date" text not null,
  "category_key" text not null,
  "category_arabic" text not null,
  "total_dhikr" int4 default 0,
  "completed_dhikr" int4 default 0,
  "is_fully_completed" bool default false,
  "duration_seconds" int4 default 0,
  "completed_at" timestamptz not null
);

create table if not exists public.life_tasks (
  "id" text not null primary key,
  "user_id" uuid not null references auth.users(id) on delete cascade,
  "space_id" text not null,
  "title" text not null,
  "description" text,
  "due_date" text,
  "scheduled_time" text,
  "estimated_minutes" int4,
  "priority" text default 'medium'::text,
  "is_completed" bool default false,
  "completed_at" timestamptz,
  "is_recurring" bool default false,
  "recurrence_rule" text,
  "created_at" timestamptz default now()
);

-- Existing policy names are retained; clean installations receive the same ownership model.
do $$
declare table_name text;
begin
  foreach table_name in array array['workout_logs','custom_routines','weekly_schedule','azkar_logs','life_tasks'] loop
    execute format('alter table public.%I enable row level security', table_name);
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=table_name) then
      execute format('create policy own_rows on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', table_name);
    end if;
  end loop;
end $$;
alter table public.profiles enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles') then
    create policy own_profile on public.profiles for all to authenticated
      using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
  end if;
end $$;
grant select, insert, update, delete on public.profiles, public.workout_logs, public.custom_routines,
  public.weekly_schedule, public.azkar_logs, public.life_tasks to authenticated;

alter table public.profiles add column if not exists today_preferences jsonb;
alter table public.custom_routines
  add column if not exists is_default boolean,
  add column if not exists is_mini_rescue boolean,
  add column if not exists plan_session_id text,
  add column if not exists week_number integer,
  add column if not exists session_code text,
  add column if not exists prescriptions jsonb;

alter table public.life_tasks
  add column if not exists status text check (status in ('TODO','IN_PROGRESS','WAITING','DONE')),
  add column if not exists actual_minutes numeric check (actual_minutes >= 0),
  add column if not exists focus_sessions jsonb check (jsonb_typeof(focus_sessions) = 'array'),
  add column if not exists waiting_context jsonb check (jsonb_typeof(waiting_context) = 'object'),
  add column if not exists interruption_context jsonb check (jsonb_typeof(interruption_context) = 'object'),
  add column if not exists source_type text check (source_type in ('manual','plan','project','routine')),
  add column if not exists source_id text,
  add column if not exists project_id text,
  add column if not exists plan_id text,
  add column if not exists milestone_id text,
  add column if not exists recurring_completion_dates text[],
  add column if not exists deadline_at timestamptz,
  add column if not exists commitment text check (commitment in ('must','should','could')),
  add column if not exists goal_impact text check (goal_impact in ('high','medium','low')),
  add column if not exists depends_on_task_ids text[],
  add column if not exists updated_at timestamptz,
  add column if not exists client_data_version integer not null default 0 check (client_data_version >= 0);

create table if not exists public.projects (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id text not null default 'home' check (space_id in ('home','work')),
  title text not null,
  description text,
  status text not null default 'backlog' check (status in ('backlog','in_progress','waiting','completed')),
  steps jsonb not null default '[]'::jsonb check (jsonb_typeof(steps) = 'array'),
  next_action_id text, next_action_title text, target_date date,
  created_at timestamptz not null default now(), completed_at timestamptz,
  repository_url text, dev_url text, api_url text, branch text, run_command text,
  requires_vpn boolean not null default false, setup_notes text,
  unique (user_id, id)
);
create table if not exists public.plans (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null check (category in ('career','faith','health','finance','personal')),
  description text, target_date date,
  status text not null default 'active' check (status in ('active','paused','completed')),
  color text, icon text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, id)
);
create table if not exists public.plan_milestones (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null, title text not null,
  "order" integer not null default 0 check ("order" >= 0),
  is_completed boolean not null default false,
  target_date date, completed_at timestamptz,
  foreign key (user_id, plan_id) references public.plans(user_id, id) on delete cascade
);
create table if not exists public.workout_schedules (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  routine_id text not null,
  scheduled_time text not null check (scheduled_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  session_label text,
  duration_minutes integer not null check (duration_minutes between 0 and 1440),
  is_enabled boolean not null default true
);
create table if not exists public.day_plans (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  available_minutes integer not null check (available_minutes between 0 and 1440),
  end_time text not null check (end_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  essential_task_ids text[] not null default '{}',
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

do $$
declare table_name text;
begin
  foreach table_name in array array['projects','plans','plan_milestones','workout_schedules','day_plans'] loop
    execute format('alter table public.%I enable row level security', table_name);
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=table_name and policyname='own_rows') then
      execute format('create policy own_rows on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', table_name);
    end if;
    execute format('revoke all on public.%I from anon', table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
  end loop;
end $$;
create index if not exists workout_logs_user_id_idx on public.workout_logs(user_id);
create index if not exists custom_routines_user_id_idx on public.custom_routines(user_id);
create index if not exists weekly_schedule_user_id_idx on public.weekly_schedule(user_id);
create index if not exists azkar_logs_user_id_idx on public.azkar_logs(user_id);
create index if not exists life_tasks_user_id_idx on public.life_tasks(user_id);
-- projects/plans/day_plans UNIQUE indexes already start with user_id.
create index if not exists plan_milestones_user_plan_idx on public.plan_milestones(user_id, plan_id);
create index if not exists workout_schedules_user_id_idx on public.workout_schedules(user_id);

-- The trigger needs elevated insert permission, but must not be a publicly callable RPC.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles(id,user_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',new.email));
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
do $$ begin
  if not exists (select 1 from pg_trigger where tgname='on_auth_user_created' and tgrelid='auth.users'::regclass) then
    create trigger on_auth_user_created after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end $$;
notify pgrst, 'reload schema';
