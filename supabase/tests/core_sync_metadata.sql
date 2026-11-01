-- Read-only verification; no users or test records are created.
with new_tables(table_name) as (
  values ('projects'),('plans'),('plan_milestones'),('workout_schedules'),('day_plans')
), expected_task_fields(column_name) as (
  values ('status'),('actual_minutes'),('focus_sessions'),('waiting_context'),('interruption_context'),
  ('source_type'),('source_id'),('project_id'),('plan_id'),('milestone_id'),('recurring_completion_dates'),
  ('deadline_at'),('commitment'),('goal_impact'),('depends_on_task_ids'),('updated_at'),('client_data_version')
)
select
  (select count(*)=5 from new_tables t join pg_class c on c.relname=t.table_name
    join pg_namespace n on n.oid=c.relnamespace and n.nspname='public' where c.relrowsecurity) as new_tables_have_rls,
  (select count(*)=5 from new_tables t join pg_policies p on p.tablename=t.table_name and p.schemaname='public'
    where p.cmd='ALL' and p.roles=array['authenticated']::name[] and p.qual like '%auth.uid()%user_id%' and p.with_check like '%auth.uid()%user_id%') as own_row_policies_present,
  (select bool_and(has_table_privilege('authenticated','public.'||table_name,'SELECT')
    and has_table_privilege('authenticated','public.'||table_name,'INSERT')
    and has_table_privilege('authenticated','public.'||table_name,'UPDATE')
    and has_table_privilege('authenticated','public.'||table_name,'DELETE')
    and not has_table_privilege('anon','public.'||table_name,'SELECT')) from new_tables) as explicit_access_grants_valid,
  (select count(*)=17 from expected_task_fields e join information_schema.columns c
    on c.table_schema='public' and c.table_name='life_tasks' and c.column_name=e.column_name) as full_task_fields_present,
  exists(select 1 from pg_constraint where conrelid='public.plan_milestones'::regclass
    and contype='f' and array_length(conkey,1)=2 and confrelid='public.plans'::regclass) as account_scoped_milestone_fk,
  not has_function_privilege('anon','public.handle_new_user()','EXECUTE')
    and not has_function_privilege('authenticated','public.handle_new_user()','EXECUTE') as trigger_not_callable_by_clients,
  (select count(*)=0 from auth.users where email like '%@lifeos-schema-test.invalid') as no_test_accounts_persisted;
