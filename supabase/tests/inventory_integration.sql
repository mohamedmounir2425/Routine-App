begin;
select set_config('lifeos.inventory_a',gen_random_uuid()::text,true),set_config('lifeos.inventory_b',gen_random_uuid()::text,true);
insert into auth.users(id,email,raw_user_meta_data) values
(current_setting('lifeos.inventory_a')::uuid,current_setting('lifeos.inventory_a')||'@lifeos-inventory-test.invalid','{}'),
(current_setting('lifeos.inventory_b')::uuid,current_setting('lifeos.inventory_b')||'@lifeos-inventory-test.invalid','{}');
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('lifeos.inventory_a'),'role','authenticated')::text,true);
do $$ declare r jsonb; item text:=current_setting('lifeos.inventory_a')||'_item'; h jsonb; begin
 h:=jsonb_build_array(jsonb_build_object('id','audit-1','at','2026-11-01T10:00:00Z','kind','count','before',null,'after',4,'unit','كيس','delta',null,'note',''));
 r:=public.sync_apply_mutation('inventory_items',item,'upsert',jsonb_build_object('name','Milk','quantity',4,'unit','كيس','state','available','history',h),0,'inventory-create');
 if r->>'status'<>'applied' or jsonb_array_length(r->'row'->'history')<>1 then raise exception 'Inventory create/history failed: %',r; end if;
 r:=public.sync_apply_mutation('inventory_items',item,'upsert',jsonb_build_object('quantity',0,'state','out'),1,'inventory-empty');
 if r->>'status'<>'applied' then raise exception 'Out state failed'; end if;
 r:=public.sync_apply_mutation('inventory_items',item,'upsert',jsonb_build_object('quantity',10,'state','available'),1,'inventory-stale');
 if r->>'status'<>'conflict' then raise exception 'Stale audit overwrote stock'; end if;
 begin perform public.sync_apply_mutation('inventory_items',item,'upsert',jsonb_build_object('quantity',-2),2,'negative'); raise exception 'Negative stock accepted'; exception when check_violation then null; end;
 begin perform public.sync_apply_mutation('inventory_items',item,'upsert',jsonb_build_object('history',jsonb_build_array(jsonb_build_object('id','bad'))),2,'bad-history'); raise exception 'Bad history accepted'; exception when invalid_parameter_value then null; end;
 begin update public.inventory_items set quantity=20 where id=item; raise exception 'Direct inventory write accepted'; exception when insufficient_privilege then null; end;
 if jsonb_array_length(public.sync_read_snapshot()->'tables'->'inventory_items')<>1 then raise exception 'Inventory missing from snapshot'; end if;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('lifeos.inventory_b'),'role','authenticated')::text,true);
do $$ declare r jsonb; begin
 if exists(select 1 from public.inventory_items) then raise exception 'Inventory RLS leak'; end if;
 if jsonb_array_length(public.sync_read_snapshot()->'tables'->'inventory_items')<>0 then raise exception 'Inventory snapshot leak'; end if;
 r:=public.sync_apply_mutation('inventory_items',current_setting('lifeos.inventory_a')||'_item','read',null,0,'read');
 if r->'row'<>'null'::jsonb then raise exception 'Inventory RPC leak'; end if;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('lifeos.inventory_a'),'role','authenticated')::text,true);
do $$ declare r jsonb; begin
 r:=public.sync_apply_mutation('inventory_items',current_setting('lifeos.inventory_a')||'_item','delete',null,2,'delete');
 if not(r->>'deleted')::boolean then raise exception 'Inventory tombstone missing'; end if;
end $$;
set local role anon;
do $$ begin
 begin perform 1 from public.inventory_items; raise exception 'Anonymous read accepted'; exception when insufficient_privilege then null; end;
 begin perform public.sync_apply_mutation('inventory_items','anon','delete',null,0,'anon'); raise exception 'Anonymous mutation accepted'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select true as passed, 'Inventory CAS, audit history, constraints, ownership, tombstones, anonymous denial' as verified;
rollback;
