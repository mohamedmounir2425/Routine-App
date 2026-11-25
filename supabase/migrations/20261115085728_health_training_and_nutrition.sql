-- Personal health records use the existing CAS protocol. No household access is granted.
-- Logical relationships use owner-scoped local IDs in payload; deleted recipe references remain readable.
create table public.health_records (
 id text primary key check(length(id) between 1 and 512),
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('exercise','plan','run','occurrence','nutrition','nutritionLog','weight','execution','preferences')),
 payload jsonb not null check(jsonb_typeof(payload)='object' and octet_length(payload::text)<=500000),
 updated_at timestamptz not null default now(),
 check(id = user_id::text || ':' || case when kind='preferences' then 'health-preferences' else payload->>'id' end),
 check(kind='preferences' or coalesce(jsonb_typeof(payload->'id')='string' and length(payload->>'id')>0,false))
);
create index health_records_owner_kind_idx on public.health_records(user_id,kind);
create unique index health_records_preferences_idx on public.health_records(user_id) where kind='preferences';
alter table public.health_records enable row level security;
revoke all on public.health_records from anon,authenticated;
grant select on public.health_records to authenticated;
create policy own_health_records on public.health_records for select to authenticated using ((select auth.uid())=user_id);
create trigger lifeos_track_version after insert or update or delete on public.health_records for each row execute function lifeos_internal.track_entity_version();

create function lifeos_internal.validate_health_record() returns trigger language plpgsql security invoker set search_path='' as $$
declare d jsonb:=new.payload; s jsonb; i jsonb; k text;
begin
 if new.kind in ('plan','nutrition') then
  if jsonb_typeof(d->'name') is distinct from 'string' or length(btrim(d->>'name')) not between 1 and 500 then raise exception 'Invalid health name' using errcode='22023'; end if;
 end if;
 foreach k in array array['date','originalDate','effectiveFrom','startDate','endDate','endedOn'] loop
  if d ? k and d->k <> 'null'::jsonb then
   if (d->>k) !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Invalid health date' using errcode='22023'; end if;
   perform (d->>k)::date;
  end if;
 end loop;
 if d ? 'endDate' and d ? 'startDate' and (d->>'endDate')::date < (d->>'startDate')::date then raise exception 'Invalid health period' using errcode='22023'; end if;
 if new.kind='exercise' then
  if jsonb_typeof(d->'name') is distinct from 'string' or jsonb_typeof(d->'arabicName') is distinct from 'string' or jsonb_typeof(d->'instructions') is distinct from 'array' or jsonb_typeof(d->'targetMuscles') is distinct from 'array' or coalesce((d->>'durationSeconds')::numeric,0)<=0 then raise exception 'Invalid exercise' using errcode='22023'; end if;
 elsif new.kind='plan' then
  if jsonb_typeof(d->'sessions') is distinct from 'array' or jsonb_array_length(d->'sessions')=0 then raise exception 'Sessions required' using errcode='22023'; end if;
  for s in select * from jsonb_array_elements(d->'sessions') loop
   if jsonb_typeof(s->'id') is distinct from 'string' or jsonb_typeof(s->'items') is distinct from 'array' then raise exception 'Invalid session' using errcode='22023'; end if;
   for i in select * from jsonb_array_elements(s->'items') loop
    if jsonb_typeof(i->'id') is distinct from 'string' or jsonb_typeof(i->'exerciseId') is distinct from 'string' or coalesce((i->>'sets')::numeric,0) not between 1 and 100 then raise exception 'Invalid exercise item' using errcode='22023'; end if;
    foreach k in array array['durationSeconds','reps','restSeconds','holdSeconds'] loop
     if i ? k and i->k <> 'null'::jsonb and ((i->>k)::numeric < case when k='restSeconds' then 0 else 1 end or (i->>k)::numeric>36000) then raise exception 'Invalid prescription' using errcode='22023'; end if;
    end loop;
   end loop;
  end loop;
 elsif new.kind='run' then
  if jsonb_typeof(d->'planId') is distinct from 'string' or jsonb_typeof(d->'rules') is distinct from 'array' or jsonb_typeof(d->'pauses') is distinct from 'array' or not(d ? 'effectiveFrom') then raise exception 'Invalid training run' using errcode='22023'; end if;
  for i in select * from jsonb_array_elements(d->'rules') loop
   if jsonb_typeof(i->'sessionId') is distinct from 'string' or coalesce((i->>'day')::int,-1) not between 0 and 6 or (i ? 'time' and i->>'time' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$') then raise exception 'Invalid schedule' using errcode='22023'; end if;
  end loop;
 elsif new.kind='occurrence' then
  if coalesce(d->>'status','') not in ('pending','completed','partial','skipped') or not(d ?& array['planId','runId','sessionId','date','originalDate']) then raise exception 'Invalid occurrence' using errcode='22023'; end if;
 elsif new.kind='nutrition' then
  if coalesce(d->>'mode','') not in ('text','meals') or jsonb_typeof(d->'meals') is distinct from 'array' or jsonb_typeof(d->'tracking') is distinct from 'boolean' or jsonb_typeof(d->'weightTracking') is distinct from 'boolean' then raise exception 'Invalid nutrition plan' using errcode='22023'; end if;
  if d->>'mode'='text' and length(btrim(coalesce(d->>'text','')))=0 then raise exception 'Nutrition text required' using errcode='22023'; end if;
  if d->>'mode'='meals' and jsonb_array_length(d->'meals')=0 then raise exception 'Meals required' using errcode='22023'; end if;
  for i in select * from jsonb_array_elements(d->'meals') loop
   if jsonb_typeof(i->'id') is distinct from 'string' or (length(btrim(coalesce(i->>'text','')))=0 and length(coalesce(i->>'recipeId',''))=0) then raise exception 'Invalid nutrition meal' using errcode='22023'; end if;
  end loop;
 elsif new.kind='nutritionLog' then
  if coalesce(d->>'status','') not in ('yes','partial','no') or (d->>'id') is distinct from ('nutrition-day:' || (d->>'planId') || ':' || (d->>'trackingId') || ':' || (d->>'date')) then raise exception 'Invalid nutrition log' using errcode='22023'; end if;
 elsif new.kind='weight' then
  if coalesce((d->>'value')::numeric,0)<=0 or (d->>'value')::numeric>2000 or coalesce(d->>'unit','') not in ('kg','lb') then raise exception 'Invalid weight measurement' using errcode='22023'; end if;
 elsif new.kind='execution' then
  if not(d ?& array['routineId','routineName','completedAt','durationMinutes','exercisesCompleted','totalExercises']) or (d->>'exercisesCompleted')::int<0 or (d->>'totalExercises')::int<(d->>'exercisesCompleted')::int then raise exception 'Invalid execution' using errcode='22023'; end if;
  perform (d->>'completedAt')::timestamptz;
 end if;
 return new;
end $$;
revoke all on function lifeos_internal.validate_health_record() from public,anon,authenticated;
create trigger validate_health_record before insert or update on public.health_records for each row execute function lifeos_internal.validate_health_record();

create or replace function lifeos_internal.apply_sync_mutation(
  p_table text,p_id text,p_action text,p_data jsonb,p_expected_revision bigint,p_operation_id text
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare
 uid uuid := auth.uid();
 meta public.sync_entity_versions%rowtype;
 current_row jsonb;
 owner_column text;
 payload jsonb;
 cols text; assignments text; request_hash text;
begin
 if uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if p_table is null or not(p_table=any(array['profiles','workout_logs','custom_routines','weekly_schedule','azkar_logs','life_tasks','projects','plans','plan_milestones','workout_schedules','day_plans','recipes','inventory_items','shopping_items','stock_receipts','health_records'])) then
  raise exception 'Unsupported entity' using errcode='22023';
 end if;
 if p_id is null or length(p_id)=0 or length(p_id)>512 or p_action is null or p_action not in ('read','upsert','delete') then raise exception 'Invalid operation' using errcode='22023'; end if;
 owner_column := case when p_table='profiles' then 'id' else 'user_id' end;
 if p_table='profiles' and p_id<>uid::text then raise exception 'Profile ownership mismatch' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 select * into meta from public.sync_entity_versions
  where user_id=uid and entity_table=p_table and entity_id=p_id for update;
 execute format('select to_jsonb(r) from public.%I r where id::text=$1 and %I=$2',p_table,owner_column)
  into current_row using p_id,uid;
 if p_action='read' then return jsonb_build_object('status','read','revision',coalesce(meta.revision,0),'deleted',current_row is null,'row',current_row); end if;
 if p_expected_revision is null or p_expected_revision<0 or p_operation_id is null or length(p_operation_id)<1 or length(p_operation_id)>128 then raise exception 'Expected revision and operation ID required' using errcode='22023'; end if;
 request_hash := encode(sha256(convert_to(jsonb_build_object('action',p_action,'data',p_data)::text,'UTF8')),'hex');
 if meta.last_operation_id=p_operation_id then
  if meta.last_request_hash<>request_hash then raise exception 'Operation ID reused for different data' using errcode='22023'; end if;
  return jsonb_build_object('status','applied','revision',meta.revision,'deleted',meta.deleted,'row',current_row);
 end if;
 if p_action='delete' and meta.deleted then
  return jsonb_build_object('status','applied','revision',meta.revision,'deleted',true,'row',null);
 end if;
 if coalesce(meta.revision,0)<>p_expected_revision then
  return jsonb_build_object('status','conflict','revision',coalesce(meta.revision,0),'deleted',current_row is null,'row',current_row);
 end if;
 if current_row is not null and meta.revision is null then raise exception 'Missing revision metadata'; end if;
 perform set_config('lifeos.operation_id',p_operation_id,true);
 perform set_config('lifeos.request_hash',request_hash,true);
 if p_action='delete' then
  if p_table='profiles' then raise exception 'Delete account through Auth, not profile sync' using errcode='22023'; end if;
  if p_table='projects' then delete from public.life_tasks where user_id=uid and project_id=p_id; end if;
  if p_table='plans' then delete from public.life_tasks where user_id=uid and plan_id=p_id; end if;
  execute format('delete from public.%I where id::text=$1 and %I=$2',p_table,owner_column) using p_id,uid;
  if current_row is null then
   insert into public.sync_entity_versions as v(user_id,entity_table,entity_id,revision,deleted,last_operation_id,last_request_hash)
   values(uid,p_table,p_id,1,true,p_operation_id,request_hash)
   on conflict(user_id,entity_table,entity_id) do update set revision=v.revision+1,deleted=true,
    updated_at=clock_timestamp(),last_operation_id=p_operation_id,last_request_hash=request_hash;
  end if;
 else
  if p_data is null or jsonb_typeof(p_data)<>'object' then raise exception 'Object payload required' using errcode='22023'; end if;
  if p_data ? 'id' and p_data->>'id' is distinct from p_id then raise exception 'Entity ID mismatch' using errcode='22023'; end if;
  if p_table<>'profiles' and p_data ? 'user_id' and p_data->>'user_id' is distinct from uid::text then raise exception 'Ownership mismatch' using errcode='42501'; end if;
  payload := p_data || jsonb_build_object('id',p_id,owner_column,uid::text);
  if exists(select 1 from jsonb_object_keys(payload) k where not exists(
    select 1 from pg_attribute a where a.attrelid=format('public.%I',p_table)::regclass
      and a.attname=k and a.attnum>0 and not a.attisdropped and a.attgenerated='')) then
    raise exception 'Unknown or generated payload column' using errcode='22023';
  end if;
  if current_row is null then
   select string_agg(format('%I',k),',') into cols from jsonb_object_keys(payload) k;
   execute format('insert into public.%I(%s) select %s from jsonb_populate_record(null::public.%I,$1)',p_table,cols,cols,p_table) using payload;
  else
   select string_agg(format('%I=src.%I',k,k),',') into assignments from jsonb_object_keys(payload) k where k not in ('id','user_id');
   if assignments is null then raise exception 'No mutable fields' using errcode='22023'; end if;
   execute format('update public.%I dst set %s from jsonb_populate_record(null::public.%I,$1) src where dst.id::text=$2 and dst.%I=$3',p_table,assignments,p_table,owner_column) using payload,p_id,uid;
  end if;
 end if;
 select * into meta from public.sync_entity_versions where user_id=uid and entity_table=p_table and entity_id=p_id;
 execute format('select to_jsonb(r) from public.%I r where id::text=$1 and %I=$2',p_table,owner_column) into current_row using p_id,uid;
 return jsonb_build_object('status','applied','revision',meta.revision,'deleted',meta.deleted,'row',current_row);
end $$;


create or replace function lifeos_internal.read_sync_snapshot()
returns jsonb language plpgsql security definer set search_path=''
as $$
declare uid uuid:=auth.uid(); t text; rows jsonb; result jsonb:='{}'; versions jsonb;
begin
 if uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 foreach t in array array['profiles','workout_logs','custom_routines','weekly_schedule','azkar_logs','life_tasks','projects','plans','plan_milestones','workout_schedules','day_plans','recipes','inventory_items','shopping_items','stock_receipts','health_records'] loop
  execute format('select coalesce(jsonb_agg(to_jsonb(r) order by id),''[]''::jsonb) from public.%I r where %I=$1',t,case when t='profiles' then 'id' else 'user_id' end) into rows using uid;
  result:=jsonb_set(result,array[t],rows);
 end loop;
 select coalesce(jsonb_agg(to_jsonb(v) order by id),'[]'::jsonb) into versions from public.sync_entity_versions v where user_id=uid;
 return jsonb_build_object('tables',result,'versions',versions);
end $$;

notify pgrst,'reload schema';
