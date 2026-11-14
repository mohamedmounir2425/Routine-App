-- Stage 0 additive schema contract for tasks, projects, and day plans.
-- Preserves existing user rows and versioned sync compatibility.

alter table public.life_tasks
  add column if not exists available_from date,
  add column if not exists is_someday boolean not null default false,
  add column if not exists review_date date,
  add column if not exists task_category text check (task_category in ('general', 'maintenance')),
  add column if not exists household_id uuid,
  add column if not exists visibility text not null default 'private' check (visibility in ('private', 'household')),
  add column if not exists assigned_user_id uuid;

alter table public.projects
  add column if not exists review_date date,
  add column if not exists household_id uuid,
  add column if not exists visibility text not null default 'private' check (visibility in ('private', 'household'));

alter table public.day_plans
  add column if not exists selected_items jsonb not null default '[]'::jsonb
    check (jsonb_typeof(selected_items) = 'array');

create or replace function lifeos_internal.validate_day_plan_selected_items()
returns trigger language plpgsql set search_path = ''
as $$
declare
  item jsonb;
  seen_keys text[] := '{}';
  ref_key text;
  src_type text;
begin
  if new.selected_items is null or jsonb_typeof(new.selected_items) <> 'array' then
    raise exception 'day_plans.selected_items must be a JSON array' using errcode = '22023';
  end if;

  for item in select * from jsonb_array_elements(new.selected_items) loop
    if jsonb_typeof(item) <> 'object' then
      raise exception 'Each selected_items entry must be an object' using errcode = '22023';
    end if;
    ref_key := item->>'refKey';
    src_type := item->>'sourceType';
    if ref_key is null or length(btrim(ref_key)) = 0 then
      raise exception 'selected_items.refKey is required' using errcode = '22023';
    end if;
    if ref_key = any(seen_keys) then
      raise exception 'Duplicate refKey in day_plans.selected_items: %', ref_key using errcode = '22023';
    end if;
    seen_keys := array_append(seen_keys, ref_key);

    if src_type = 'task' then
      if (item->>'taskId') is null or ref_key <> ('task:' || (item->>'taskId')) then
        raise exception 'Invalid task selected item refKey: %', ref_key using errcode = '22023';
      end if;
    elsif src_type = 'project_step' then
      if (item->>'projectId') is null or (item->>'stepId') is null
         or ref_key <> ('project_step:' || (item->>'projectId') || ':' || (item->>'stepId')) then
        raise exception 'Invalid project_step selected item refKey: %', ref_key using errcode = '22023';
      end if;
    elsif src_type = 'routine_occurrence' then
      if (item->>'taskId') is null or (item->>'occurrenceDate') is null
         or ref_key <> ('routine_occurrence:' || (item->>'taskId') || ':' || (item->>'occurrenceDate')) then
        raise exception 'Invalid routine_occurrence selected item refKey: %', ref_key using errcode = '22023';
      end if;
    else
      raise exception 'Unsupported selected_items.sourceType: %', coalesce(src_type, 'NULL') using errcode = '22023';
    end if;
  end loop;

  return new;
end;
$$;

revoke all on function lifeos_internal.validate_day_plan_selected_items() from public, anon, authenticated;

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'lifeos_validate_day_plan_selected_items'
      and tgrelid = 'public.day_plans'::regclass
  ) then
    create trigger lifeos_validate_day_plan_selected_items
      before insert or update on public.day_plans
      for each row execute function lifeos_internal.validate_day_plan_selected_items();
  end if;
end $$;

notify pgrst, 'reload schema';
