-- Synthetic owners only. Run on an isolated database or wrap through SQL Editor; all fixtures roll back.
begin;
select set_config('lifeos.health_a',gen_random_uuid()::text,true),set_config('lifeos.health_b',gen_random_uuid()::text,true);
insert into auth.users(id,email,raw_user_meta_data) values
 (current_setting('lifeos.health_a')::uuid,'health-a@lifeos-test.invalid','{}'),
 (current_setting('lifeos.health_b')::uuid,'health-b@lifeos-test.invalid','{}');
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('lifeos.health_a'),'role','authenticated')::text,true);
do $$ declare r jsonb; uid text:=current_setting('lifeos.health_a'); p jsonb; item text; begin
 p:=jsonb_build_object('id','shared-template','name','My plan','description','','archived',false,'painTracking',false,'updatedAt',now(),'sessions',jsonb_build_array(jsonb_build_object('id','s1','name','Session','items',jsonb_build_array(jsonb_build_object('id','i1','exerciseId','e1','sets',1,'durationSeconds',30,'restSeconds',0)))));
 item:=uid||':shared-template';
 r:=public.sync_apply_mutation('health_records',item,'upsert',jsonb_build_object('kind','plan','payload',p),0,'health-create');
 if r->>'status'<>'applied' or r->'row'->'payload'->>'name'<>'My plan' then raise exception 'Health create failed'; end if;
 r:=public.sync_apply_mutation('health_records',item,'upsert',jsonb_build_object('kind','plan','payload',p),0,'health-create');
 if (r->>'revision')::int<>1 then raise exception 'Health retry duplicated mutation'; end if;
 p:=p||jsonb_build_object('name','Updated plan');
 r:=public.sync_apply_mutation('health_records',item,'upsert',jsonb_build_object('kind','plan','payload',p),1,'health-update');
 if r->>'status'<>'applied' then raise exception 'Health update failed'; end if;
 r:=public.sync_apply_mutation('health_records',item,'upsert',jsonb_build_object('kind','plan','payload',p),1,'health-stale');
 if r->>'status'<>'conflict' then raise exception 'Health stale write accepted'; end if;
 begin perform public.sync_apply_mutation('health_records',uid||':bad-plan','upsert',jsonb_build_object('kind','plan','payload',jsonb_build_object('id','bad-plan','name','Bad','sessions','[]'::jsonb)),0,'health-bad'); raise exception 'Empty plan accepted'; exception when invalid_parameter_value then null; end;
 begin update public.health_records set payload='{}' where id=item; raise exception 'Direct health write accepted'; exception when insufficient_privilege then null; end;
 p:=jsonb_build_object('id','nutrition','name','My food','mode','meals','text','','tracking',true,'weightTracking',false,'trackingId','track1','meals',jsonb_build_array(jsonb_build_object('id','meal1','name','Lunch','text','Meal','portion','My portion','alternatives','','notes','','recipeId','missing-recipe','recipeTitle','Fallback')));
 perform public.sync_apply_mutation('health_records',uid||':nutrition','upsert',jsonb_build_object('kind','nutrition','payload',p),0,'nutrition-create');
 p:=jsonb_build_object('id','nutrition-day:nutrition:track1:2026-11-15','planId','nutrition','trackingId','track1','date','2026-11-15','status','yes','note','');
 perform public.sync_apply_mutation('health_records',uid||':'||(p->>'id'),'upsert',jsonb_build_object('kind','nutritionLog','payload',p),0,'nutrition-log');
 p:=p||jsonb_build_object('status','partial','note','Edited');
 perform public.sync_apply_mutation('health_records',uid||':'||(p->>'id'),'upsert',jsonb_build_object('kind','nutritionLog','payload',p),1,'nutrition-log-edit');
 if (select count(*) from public.health_records where kind='nutritionLog')<>1 then raise exception 'Daily log duplicated'; end if;
 begin perform public.sync_apply_mutation('health_records',uid||':bad-weight','upsert',jsonb_build_object('kind','weight','payload',jsonb_build_object('id','bad-weight','value',-1,'unit','kg')),0,'bad-weight'); raise exception 'Invalid weight accepted'; exception when invalid_parameter_value then null; end;
 if jsonb_array_length(public.sync_read_snapshot()->'tables'->'health_records')<>3 then raise exception 'Health records missing from snapshot'; end if;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('lifeos.health_b'),'role','authenticated')::text,true);
do $$ declare r jsonb; item text:=current_setting('lifeos.health_a')||':shared-template'; begin
 if exists(select 1 from public.health_records) then raise exception 'Health RLS leak'; end if;
 if jsonb_array_length(public.sync_read_snapshot()->'tables'->'health_records')<>0 then raise exception 'Health snapshot leak'; end if;
 r:=public.sync_apply_mutation('health_records',item,'read',null,0,'health-other-read');
 if r->'row'<>'null'::jsonb then raise exception 'Health RPC read leak'; end if;
 begin perform public.sync_apply_mutation('health_records',item,'upsert',jsonb_build_object('kind','preferences','payload','{}'::jsonb),0,'health-steal'); raise exception 'Cross-account health write accepted'; exception when unique_violation or check_violation then null; end;
 perform public.sync_apply_mutation('health_records',current_setting('lifeos.health_b')||':health-preferences','upsert',jsonb_build_object('kind','preferences','payload','{}'::jsonb),0,'own-preferences');
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('lifeos.health_a'),'role','authenticated')::text,true);
do $$ declare r jsonb; item text:=current_setting('lifeos.health_a')||':shared-template'; begin
 r:=public.sync_apply_mutation('health_records',item,'delete',null,2,'health-delete');
 if not(r->>'deleted')::boolean then raise exception 'Health tombstone missing'; end if;
 r:=public.sync_apply_mutation('health_records',item,'upsert',jsonb_build_object('kind','preferences','payload','{}'::jsonb),2,'health-resurrect');
 if r->>'status'<>'conflict' then raise exception 'Health tombstone resurrected'; end if;
end $$;
set local role anon;
do $$ begin
 begin perform 1 from public.health_records; raise exception 'Anonymous health read allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select true as passed, 'Health: private CRUD, nested validation, CAS retries, daily upsert, snapshots and owner isolation' as verified;
rollback;
