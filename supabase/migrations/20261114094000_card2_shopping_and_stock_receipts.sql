-- Card 2: Standalone Shopping Items & Idempotent Stock Receipts Contract

create table if not exists public.shopping_items (
  id text primary key check (length(id) between 1 and 512),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 160),
  category text not null default 'general' check (length(category) <= 120),
  store_context text not null default 'any' check (
    store_context in ('supermarket', 'greengrocer', 'pharmacy', 'family_visit', 'any')
  ),
  quantity_needed numeric check (quantity_needed is null or (quantity_needed > 0 and quantity_needed <= 100000000)),
  unit text not null default '' check (length(unit) <= 120),
  quantity_text text not null default '' check (length(quantity_text) <= 160),
  quantity_purchased numeric check (quantity_purchased is null or (quantity_purchased >= 0 and quantity_purchased <= 100000000)),
  quantity_stocked numeric not null default 0 check (quantity_stocked >= 0 and quantity_stocked <= 100000000),
  is_bought boolean not null default false,
  bought_at timestamptz,
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  source_type text not null default 'manual' check (
    source_type in ('manual', 'inventory_low', 'recipe', 'legacy_task')
  ),
  source_inventory_item_id text,
  legacy_task_id text,
  notes text not null default '' check (length(notes) <= 2000),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, legacy_task_id)
);

create index if not exists shopping_items_owner_bought_idx
  on public.shopping_items(user_id, is_bought, archived_at);

alter table public.shopping_items enable row level security;
revoke all on public.shopping_items from anon, authenticated;
grant select on public.shopping_items to authenticated;

drop policy if exists own_shopping_items on public.shopping_items;
create policy own_shopping_items
  on public.shopping_items
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop trigger if exists lifeos_track_version on public.shopping_items;
create trigger lifeos_track_version
  after insert or update or delete on public.shopping_items
  for each row execute function lifeos_internal.track_entity_version();


create table if not exists public.stock_receipts (
  id text primary key check (length(id) between 1 and 512),
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id text not null check (length(btrim(operation_id)) between 1 and 128),
  shopping_item_id text not null check (length(btrim(shopping_item_id)) between 1 and 512),
  inventory_item_id text not null check (length(btrim(inventory_item_id)) between 1 and 512),
  quantity_added numeric not null check (quantity_added > 0 and quantity_added <= 100000000),
  unit text not null default '' check (length(btrim(unit)) between 1 and 120),
  location text not null default 'غير محدد' check (length(btrim(location)) between 1 and 120),
  expires_on date,
  created_at timestamptz not null default now(),
  unique (user_id, operation_id)
);

create index if not exists stock_receipts_owner_shopping_idx
  on public.stock_receipts(user_id, shopping_item_id);

alter table public.stock_receipts enable row level security;
revoke all on public.stock_receipts from anon, authenticated;
grant select on public.stock_receipts to authenticated;

drop policy if exists own_stock_receipts on public.stock_receipts;
create policy own_stock_receipts
  on public.stock_receipts
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop trigger if exists lifeos_track_version on public.stock_receipts;
create trigger lifeos_track_version
  after insert or update or delete on public.stock_receipts
  for each row execute function lifeos_internal.track_entity_version();


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
 if p_table is null or not(p_table=any(array['profiles','workout_logs','custom_routines','weekly_schedule','azkar_logs','life_tasks','projects','plans','plan_milestones','workout_schedules','day_plans','recipes','inventory_items','shopping_items','stock_receipts'])) then
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
 foreach t in array array['profiles','workout_logs','custom_routines','weekly_schedule','azkar_logs','life_tasks','projects','plans','plan_milestones','workout_schedules','day_plans','recipes','inventory_items','shopping_items','stock_receipts'] loop
  execute format('select coalesce(jsonb_agg(to_jsonb(r) order by id),''[]''::jsonb) from public.%I r where %I=$1',t,case when t='profiles' then 'id' else 'user_id' end) into rows using uid;
  result:=jsonb_set(result,array[t],rows);
 end loop;
 select coalesce(jsonb_agg(to_jsonb(v) order by id),'[]'::jsonb) into versions from public.sync_entity_versions v where user_id=uid;
 return jsonb_build_object('tables',result,'versions',versions);
end $$;

notify pgrst,'reload schema';
