-- Synthetic users and fixtures are transaction-scoped and rolled back.
begin;
select set_config('lifeos.recipe_a',gen_random_uuid()::text,true),set_config('lifeos.recipe_b',gen_random_uuid()::text,true);
insert into auth.users(id,email,raw_user_meta_data) values
(current_setting('lifeos.recipe_a')::uuid,current_setting('lifeos.recipe_a')||'@lifeos-recipe-test.invalid','{}'),
(current_setting('lifeos.recipe_b')::uuid,current_setting('lifeos.recipe_b')||'@lifeos-recipe-test.invalid','{}');
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('lifeos.recipe_a'),'role','authenticated')::text,true);
do $$ declare r jsonb; item text:=current_setting('lifeos.recipe_a')||'_recipe'; begin
 r:=public.sync_apply_mutation('recipes',item,'upsert',jsonb_build_object('title','Recipe test','meal_types',jsonb_build_array('breakfast','dinner'),'ingredients',jsonb_build_array(jsonb_build_object('name','Egg','quantity','2')),'steps',jsonb_build_array('Cook'),'image_url','https://example.com/a.jpg','video_url','https://youtu.be/example'),0,'recipe-create');
 if r->>'status'<>'applied' or jsonb_array_length(r->'row'->'meal_types')<>2 then raise exception 'Recipe create failed: %',r; end if;
 r:=public.sync_apply_mutation('recipes',item,'upsert',jsonb_build_object('title','Updated recipe'),1,'recipe-update');
 if r->>'status'<>'applied' then raise exception 'Recipe update failed'; end if;
 r:=public.sync_apply_mutation('recipes',item,'upsert',jsonb_build_object('title','Stale'),1,'recipe-stale');
 if r->>'status'<>'conflict' then raise exception 'Recipe conflict protection failed'; end if;
 begin perform public.sync_apply_mutation('recipes',item,'upsert',jsonb_build_object('ingredients',jsonb_build_array(jsonb_build_object('name',42,'quantity','2'))),2,'invalid-ingredients'); raise exception 'Malformed ingredient accepted'; exception when invalid_parameter_value then null; end;
 begin perform public.sync_apply_mutation('recipes',item,'upsert',jsonb_build_object('meal_types',jsonb_build_array('invalid')),2,'invalid-meal'); raise exception 'Invalid meal accepted'; exception when check_violation then null; end;
 begin perform public.sync_apply_mutation('recipes',item,'upsert',jsonb_build_object('video_url','https://youtube.com.evil.example/v'),2,'invalid-video'); raise exception 'Invalid video host accepted'; exception when check_violation then null; end;
 begin update public.recipes set title='Direct write' where id=item; raise exception 'Direct write accepted'; exception when insufficient_privilege then null; end;
 if jsonb_array_length(public.sync_read_snapshot()->'tables'->'recipes')<>1 then raise exception 'Recipe missing in snapshot'; end if;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('lifeos.recipe_b'),'role','authenticated')::text,true);
do $$ declare r jsonb; item text:=current_setting('lifeos.recipe_a')||'_recipe'; begin
 if exists(select 1 from public.recipes) then raise exception 'Recipe RLS leak'; end if;
 if jsonb_array_length(public.sync_read_snapshot()->'tables'->'recipes')<>0 then raise exception 'Recipe snapshot leak'; end if;
 r:=public.sync_apply_mutation('recipes',item,'read',null,0,'recipe-read');
 if r->'row'<>'null'::jsonb then raise exception 'Recipe RPC read leak'; end if;
 begin perform public.sync_apply_mutation('recipes',item,'upsert',jsonb_build_object('title','Steal'),0,'steal'); raise exception 'Cross-account overwrite accepted'; exception when unique_violation then null; end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('lifeos.recipe_a'),'role','authenticated')::text,true);
do $$ declare r jsonb; item text:=current_setting('lifeos.recipe_a')||'_recipe'; begin
 r:=public.sync_apply_mutation('recipes',item,'delete',null,2,'recipe-delete');
 if not(r->>'deleted')::boolean or (r->>'revision')::int<>3 then raise exception 'Recipe tombstone missing'; end if;
 r:=public.sync_apply_mutation('recipes',item,'upsert',jsonb_build_object('title','Stale restore'),2,'stale-restore');
 if r->>'status'<>'conflict' then raise exception 'Recipe resurrected'; end if;
end $$;
set local role anon;
do $$ begin
 begin perform 1 from public.recipes; raise exception 'Anonymous recipe read allowed'; exception when insufficient_privilege then null; end;
 begin perform public.sync_apply_mutation('recipes','anon','upsert','{"title":"Anon"}',0,'anon'); raise exception 'Anonymous recipe write allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select true as passed, 'Recipes: CRUD, CAS, tombstones, JSON validation, RLS, anonymous denial' as verified;
rollback;
