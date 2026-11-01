-- Transactional integration test: synthetic Auth users and all records are rolled back.
begin;
select set_config('lifeos.test_a',gen_random_uuid()::text,true),set_config('lifeos.test_b',gen_random_uuid()::text,true);
insert into auth.users(id,email,raw_user_meta_data) values
(current_setting('lifeos.test_a')::uuid,current_setting('lifeos.test_a')||'@lifeos-sync-test.invalid','{}'),
(current_setting('lifeos.test_b')::uuid,current_setting('lifeos.test_b')||'@lifeos-sync-test.invalid','{}');
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('lifeos.test_a'),'role','authenticated')::text,true);
do $$
declare r jsonb; item text:=current_setting('lifeos.test_a')||'_task'; project text:=current_setting('lifeos.test_a')||'_project'; child text:=current_setting('lifeos.test_a')||'_child';
begin
 r:=public.sync_apply_mutation('life_tasks',item,'upsert',jsonb_build_object('title','Original','space_id','work'),0,'create-1');
 if r->>'status'<>'applied' or (r->>'revision')::int<>1 then raise exception 'Create failed: %',r; end if;
 r:=public.sync_apply_mutation('life_tasks',item,'upsert',jsonb_build_object('title','Original','space_id','work'),0,'create-1');
 if (r->>'revision')::int<>1 then raise exception 'Retry duplicated a write'; end if;
 begin perform public.sync_apply_mutation('life_tasks',item,'upsert',jsonb_build_object('title','Different','space_id','work'),0,'create-1'); raise exception 'Operation ID reuse accepted'; exception when invalid_parameter_value then null; end;
 r:=public.sync_apply_mutation('life_tasks',item,'upsert',jsonb_build_object('title','Newer','space_id','work'),1,'update-2');
 if (r->>'revision')::int<>2 then raise exception 'Update failed'; end if;
 r:=public.sync_apply_mutation('life_tasks',item,'upsert',jsonb_build_object('title','Stale','space_id','work'),1,'stale-3');
 if r->>'status'<>'conflict' or r->'row'->>'title'<>'Newer' then raise exception 'CAS did not preserve concurrent change'; end if;
 r:=public.sync_apply_mutation('life_tasks',item,'delete',null,2,'delete-4');
 if (r->>'revision')::int<>3 or not(r->>'deleted')::boolean then raise exception 'Delete tombstone missing'; end if;
 r:=public.sync_apply_mutation('life_tasks',item,'upsert',jsonb_build_object('title','Stale resurrect','space_id','work'),1,'stale-5');
 if r->>'status'<>'conflict' or not(r->>'deleted')::boolean then raise exception 'Stale resurrection accepted'; end if;
 r:=public.sync_apply_mutation('life_tasks',item,'upsert',jsonb_build_object('title','Explicit restore','space_id','work'),3,'restore-6');
 if r->>'status'<>'applied' or (r->>'revision')::int<>4 then raise exception 'Explicit restore failed'; end if;
 perform public.sync_apply_mutation('projects',project,'upsert',jsonb_build_object('title','Project','space_id','work'),0,'project-7');
 perform public.sync_apply_mutation('life_tasks',child,'upsert',jsonb_build_object('title','Child','space_id','work','project_id',project),0,'child-8');
 perform public.sync_apply_mutation('projects',project,'delete',null,1,'project-delete-9');
 if not exists(select 1 from public.sync_entity_versions where user_id=auth.uid() and entity_table='life_tasks' and entity_id=child and deleted) then raise exception 'Cascade tombstone missing'; end if;
 begin perform public.sync_apply_mutation('life_tasks',item,'upsert',jsonb_build_object('unknown_column','X'),4,'invalid-10'); raise exception 'Unknown payload column accepted'; exception when invalid_parameter_value then null; end;
 begin perform public.sync_apply_mutation('life_tasks',item,'upsert',jsonb_build_object('user_id',current_setting('lifeos.test_b')),4,'spoof-11'); raise exception 'Ownership spoof accepted'; exception when insufficient_privilege then null; end;
 begin update public.life_tasks set title='Direct overwrite' where id=item; raise exception 'Direct client write accepted'; exception when insufficient_privilege then null; end;
 r:=public.sync_read_snapshot();
 if jsonb_array_length(r->'tables'->'life_tasks')<>1 then raise exception 'Snapshot included deleted child or lost restored task'; end if;
 if not exists(select 1 from public.profiles where id=auth.uid()) then raise exception 'Auth profile trigger broken'; end if;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('lifeos.test_b'),'role','authenticated')::text,true);
do $$ declare r jsonb; item text:=current_setting('lifeos.test_a')||'_task'; begin
 r:=public.sync_read_snapshot();
 if jsonb_array_length(r->'tables'->'life_tasks')<>0 then raise exception 'Cross-account snapshot leak'; end if;
 if exists(select 1 from public.sync_entity_versions where user_id=current_setting('lifeos.test_a')::uuid) then raise exception 'Version metadata leak'; end if;
 r:=public.sync_apply_mutation('life_tasks',item,'read',null,0,'read');
 if r->'row'<>'null'::jsonb then raise exception 'Cross-account entity read leaked'; end if;
 begin perform public.sync_apply_mutation('life_tasks',item,'upsert',jsonb_build_object('title','Steal','space_id','work'),0,'steal-12'); raise exception 'Cross-account ID overwritten'; exception when unique_violation then null; end;
 begin perform public.sync_apply_mutation('profiles',current_setting('lifeos.test_a'),'read',null,0,'read'); raise exception 'Cross-account profile access accepted'; exception when insufficient_privilege then null; end;
end $$;
set local role anon;
do $$ begin
 begin perform public.sync_read_snapshot(); raise exception 'Anonymous snapshot accepted'; exception when insufficient_privilege then null; end;
 begin perform public.sync_apply_mutation('life_tasks','x','delete',null,0,'anon'); raise exception 'Anonymous mutation accepted'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select true as passed, 'CAS, tombstones, retries, cascade, ownership, anonymous denial, profile trigger' as verified;
rollback;
