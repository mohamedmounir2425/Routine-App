# بنية Supabase الحالية

تحديث مكتبة الأكلات 2026-11-01: أضيف public.recipes إلى 11 جدول بيانات سابقًا، مع sync_entity_versions (إجمالي 13 جدولًا). تفاصيل حقول recipes وRLS والمنح واختبارات backend في [توثيق المنزل](spaces/home.md). migration المطبق: [add_recipe_library](../../supabase/migrations/20261101143722_add_recipe_library.sql). اختبار CRUD وCAS والحذف والملكية والمجهول نجح بحسابين مؤقتين داخل transaction تم التراجع عنها.

آخر مراجعة: 2026-11-01، بعد تطبيق migration [complete_core_sync_schema](../../supabase/migrations/20261101101704_complete_core_sync_schema.sql) على LifeOS. تم التأكد من وجود 11 جدولًا ومن RLS والمنح والسياسات للجداول الجديدة. هذه metadata وليست نسخة بيانات.

[اللقطة السابقة قبل الاستكمال](supabase-before-sync-schema.md) محفوظة للمقارنة. ملف migration يحتوي baseline للجداول الستة القديمة وتغييرات إضافية، ويفترض توفر مخطط Supabase Auth. لا يمثل نسخة كاملة من إعدادات المشروع أو محتوى Storage.

## public.profiles

RLS: مفعّل. المفتاح الأساسي: id.

| العمود | النوع | يقبل null | الافتراضي |
|---|---|---|---|
| id | uuid | لا | — |
| user_name | text | نعم | 'بطل الروتين'::text |
| theme | text | نعم | 'dark'::text |
| active_plan_type | text | نعم | '4-weeks'::text |
| current_week_number | int4 | نعم | 1 |
| current_level_number | int4 | نعم | 1 |
| sound_beeps_enabled | bool | نعم | true |
| voice_coach_enabled | bool | نعم | true |
| voice_language | text | نعم | 'ar'::text |
| default_rest_seconds | int4 | نعم | 20 |
| reminder_enabled | bool | نعم | false |
| reminder_time | text | نعم | '18:30'::text |
| reminder_days | jsonb | نعم | '[6, 1, 3, 4]'::jsonb |
| work_break_reminder_enabled | bool | نعم | false |
| work_break_interval_minutes | int4 | نعم | 45 |
| screen_wake_lock | bool | نعم | true |
| workout_video_autoplay | bool | نعم | true |
| workout_video_muted | bool | نعم | true |
| workout_video_loop | bool | نعم | true |
| workout_default_view_mode | text | نعم | 'video'::text |
| enabled_spaces | jsonb | نعم | '["worship", "health", "work", "plans"]'::jsonb |
| has_completed_onboarding | bool | نعم | true |
| updated_at | timestamptz | نعم | now() |
| today_preferences | jsonb | نعم | — |

العلاقات:

- profiles_id_fkey: id → auth.users(id).

## public.workout_logs

RLS: مفعّل. المفتاح الأساسي: id.

| العمود | النوع | يقبل null | الافتراضي |
|---|---|---|---|
| id | text | لا | — |
| user_id | uuid | لا | — |
| routine_id | text | لا | — |
| routine_name | text | لا | — |
| completed_at | timestamptz | لا | — |
| duration_minutes | int4 | نعم | 0 |
| exercises_completed | int4 | نعم | 0 |
| total_exercises | int4 | نعم | 0 |
| week_number | int4 | نعم | — |
| session_code | text | نعم | — |
| pre_pain_score | int4 | نعم | — |
| post_pain_score | int4 | نعم | — |
| difficulty_rating | text | نعم | — |
| notes | text | نعم | — |
| created_at | timestamptz | نعم | now() |

العلاقات:

- workout_logs_user_id_fkey: user_id → auth.users(id).

## public.custom_routines

RLS: مفعّل. المفتاح الأساسي: id.

| العمود | النوع | يقبل null | الافتراضي |
|---|---|---|---|
| id | text | لا | — |
| user_id | uuid | لا | — |
| name | text | لا | — |
| description | text | نعم | — |
| exercise_ids | jsonb | لا | '[]'::jsonb |
| total_estimated_minutes | int4 | نعم | 10 |
| level | text | نعم | 'gentle'::text |
| tag | text | نعم | 'تمرين مخصص'::text |
| custom_exercise_configs | jsonb | نعم | — |
| created_at | timestamptz | نعم | now() |
| is_default | bool | نعم | — |
| is_mini_rescue | bool | نعم | — |
| plan_session_id | text | نعم | — |
| week_number | int4 | نعم | — |
| session_code | text | نعم | — |
| prescriptions | jsonb | نعم | — |

العلاقات:

- custom_routines_user_id_fkey: user_id → auth.users(id).

## public.weekly_schedule

RLS: مفعّل. المفتاح الأساسي: id.

| العمود | النوع | يقبل null | الافتراضي |
|---|---|---|---|
| id | text | لا | — |
| user_id | uuid | لا | — |
| day_of_week | int4 | لا | — |
| day_name_ar | text | لا | — |
| routine_id | text | نعم | — |
| is_rest_day | bool | نعم | false |
| rest_reason | text | نعم | — |
| session_code | text | نعم | — |
| week_number | int4 | نعم | — |
| updated_at | timestamptz | نعم | now() |

العلاقات:

- weekly_schedule_user_id_fkey: user_id → auth.users(id).

## public.azkar_logs

RLS: مفعّل. المفتاح الأساسي: id.

| العمود | النوع | يقبل null | الافتراضي |
|---|---|---|---|
| id | text | لا | — |
| user_id | uuid | لا | — |
| date | text | لا | — |
| category_key | text | لا | — |
| category_arabic | text | لا | — |
| total_dhikr | int4 | نعم | 0 |
| completed_dhikr | int4 | نعم | 0 |
| is_fully_completed | bool | نعم | false |
| duration_seconds | int4 | نعم | 0 |
| completed_at | timestamptz | لا | — |

العلاقات:

- azkar_logs_user_id_fkey: user_id → auth.users(id).

## public.life_tasks

RLS: مفعّل. المفتاح الأساسي: id.

| العمود | النوع | يقبل null | الافتراضي |
|---|---|---|---|
| id | text | لا | — |
| user_id | uuid | لا | — |
| space_id | text | لا | — |
| title | text | لا | — |
| description | text | نعم | — |
| due_date | text | نعم | — |
| scheduled_time | text | نعم | — |
| estimated_minutes | int4 | نعم | — |
| priority | text | نعم | 'medium'::text |
| is_completed | bool | نعم | false |
| completed_at | timestamptz | نعم | — |
| is_recurring | bool | نعم | false |
| recurrence_rule | text | نعم | — |
| created_at | timestamptz | نعم | now() |
| status | text | نعم | — |
| actual_minutes | numeric | نعم | — |
| focus_sessions | jsonb | نعم | — |
| waiting_context | jsonb | نعم | — |
| interruption_context | jsonb | نعم | — |
| source_type | text | نعم | — |
| source_id | text | نعم | — |
| project_id | text | نعم | — |
| plan_id | text | نعم | — |
| milestone_id | text | نعم | — |
| recurring_completion_dates | _text | نعم | — |
| deadline_at | timestamptz | نعم | — |
| commitment | text | نعم | — |
| goal_impact | text | نعم | — |
| depends_on_task_ids | _text | نعم | — |
| updated_at | timestamptz | نعم | — |
| client_data_version | int4 | لا | 0 |

العلاقات:

- life_tasks_user_id_fkey: user_id → auth.users(id).

## public.projects

RLS: مفعّل. المفتاح الأساسي: id.

| العمود | النوع | يقبل null | الافتراضي |
|---|---|---|---|
| id | text | لا | — |
| user_id | uuid | لا | — |
| space_id | text | لا | 'home'::text |
| title | text | لا | — |
| description | text | نعم | — |
| status | text | لا | 'backlog'::text |
| steps | jsonb | لا | '[]'::jsonb |
| next_action_id | text | نعم | — |
| next_action_title | text | نعم | — |
| target_date | date | نعم | — |
| created_at | timestamptz | لا | now() |
| completed_at | timestamptz | نعم | — |
| repository_url | text | نعم | — |
| dev_url | text | نعم | — |
| api_url | text | نعم | — |
| branch | text | نعم | — |
| run_command | text | نعم | — |
| requires_vpn | bool | لا | false |
| setup_notes | text | نعم | — |

العلاقات:

- projects_user_id_fkey: user_id → auth.users(id).

## public.plans

RLS: مفعّل. المفتاح الأساسي: id.

| العمود | النوع | يقبل null | الافتراضي |
|---|---|---|---|
| id | text | لا | — |
| user_id | uuid | لا | — |
| title | text | لا | — |
| category | text | لا | — |
| description | text | نعم | — |
| target_date | date | نعم | — |
| status | text | لا | 'active'::text |
| color | text | نعم | — |
| icon | text | نعم | — |
| created_at | timestamptz | لا | now() |
| updated_at | timestamptz | لا | now() |

العلاقات:

- plans_user_id_fkey: user_id → auth.users(id).
- plan_milestones_user_id_plan_id_fkey: user_id, plan_id → public.plans(user_id, id).

## public.plan_milestones

RLS: مفعّل. المفتاح الأساسي: id.

| العمود | النوع | يقبل null | الافتراضي |
|---|---|---|---|
| id | text | لا | — |
| user_id | uuid | لا | — |
| plan_id | text | لا | — |
| title | text | لا | — |
| order | int4 | لا | 0 |
| is_completed | bool | لا | false |
| target_date | date | نعم | — |
| completed_at | timestamptz | نعم | — |

العلاقات:

- plan_milestones_user_id_fkey: user_id → auth.users(id).
- plan_milestones_user_id_plan_id_fkey: user_id, plan_id → public.plans(user_id, id).

## public.workout_schedules

RLS: مفعّل. المفتاح الأساسي: id.

| العمود | النوع | يقبل null | الافتراضي |
|---|---|---|---|
| id | text | لا | — |
| user_id | uuid | لا | — |
| day_of_week | int4 | لا | — |
| routine_id | text | لا | — |
| scheduled_time | text | لا | — |
| session_label | text | نعم | — |
| duration_minutes | int4 | لا | — |
| is_enabled | bool | لا | true |

العلاقات:

- workout_schedules_user_id_fkey: user_id → auth.users(id).

## public.day_plans

RLS: مفعّل. المفتاح الأساسي: id.

| العمود | النوع | يقبل null | الافتراضي |
|---|---|---|---|
| id | text | لا | — |
| user_id | uuid | لا | — |
| date | date | لا | — |
| available_minutes | int4 | لا | — |
| end_time | text | لا | — |
| essential_task_ids | _text | لا | '{}'::text[] |
| updated_at | timestamptz | لا | now() |

العلاقات:

- day_plans_user_id_fkey: user_id → auth.users(id).

## الصلاحيات والقيود

الجداول الجديدة projects/plans/plan_milestones/workout_schedules/day_plans تقبل CRUD للدور authenticated فقط. سياسة own_rows تستخدم (select auth.uid()) = user_id في USING وWITH CHECK. أُلغيت صلاحيات anon عليها. تم التحقق من ذلك باستعلام metadata مباشر، وليس باختبار تسجيل دخول فعلي بحسابين.

سياسات الجداول الستة الأصلية لم تُستبدل عند الترحيل؛ سياسة profiles تعتمد id، والبقية user_id كما في اللقطة السابقة. ملاحظة الأداء auth_rls_initplan على السياسات القديمة ما زالت قائمة. الفهارس الجديدة على user_id وعلاقة المرحلة بالخطة تدعم القراءة بحسب الحساب؛ تحذير unused_index متوقع قبل بدء استخدامها ولا يستدعي حذفها الآن.

علاقة plan_milestones(user_id,plan_id) → plans(user_id,id) تمنع ربط مرحلة بخطة حساب آخر، وتحذف المراحل عند حذف الخطة. القيود UNIQUE على day_plans(user_id,date) تمنع خطتين لنفس المستخدم واليوم. المشاريع مميزة بمساحة home/work. شروط CHECK للحقول الجديدة تمنع قيم الحالة والوقت والمدة غير الصحيحة وبعض أشكال JSON غير الملائمة؛ التفاصيل الدقيقة في SQL.

روابط المهام إلى المشاريع والخطط والمراحل والمكونات الموجودة داخل JSON ما زالت مراجع منطقية وليست كلها FK. تم ترك ذلك للتوافق مع ترتيب الرفع والبيانات القديمة؛ لا يعني اكتمال التحقق الخادمي من كل علاقة.

## توافق الإصدارات

life_tasks.client_data_version=0 للصفوف السابقة. القراءة تحافظ على metadata المحلية الأحدث بدل تفسير أعمدة NULL المضافة كطلب مسح. الرفع من العميل الحالي يرسل النسخة 1 وكل حقول المهمة، بما في ذلك null لإزالة حقل، أو [] لإفراغ قائمة. العملاء الأقدم لا يقدمون كل هذه الضمانات؛ حدّث الأجهزة قبل اعتماد التبادل بينها.

## دالة إنشاء الحساب

public.handle_new_user() ما زالت trigger بصلاحية SECURITY DEFINER حتى تنشئ profiles عند إنشاء حساب Auth. تم تثبيت search_path إلى قيمة فارغة، واستخدام public.profiles صراحة، وإلغاء EXECUTE من PUBLIC/anon/authenticated. لا تغيّر الآلية إلى SECURITY INVOKER عشوائيًا. فحص Security Advisor بعد التعديل لم يعد يعرض التحذيرات الثلاثة القديمة على هذه الدالة؛ بقي تحذير حماية كلمات المرور المسرّبة المعطلة ضمن إعدادات Auth، ولم تُغيّر إعدادات Auth في هذه المرحلة.

## حدود التحقق

نجحت اختبارات النقل المحلية بمحاكاة cloud transport، وفحص metadata السحابية وSecurity Advisor. محاولة اختبار RLS بإنشاء حسابين مؤقتين داخل transaction ثم ROLLBACK لم تنفذ: انتهت صلاحية تأكيد execute_sql. لذلك لا يوجد ادعاء بأن اختبار حسابين أو جهازين حقيقيين قد نجح. عزل الحسابات المحلي منفذ كما في account-workspaces.md؛ التعارضات والحذف متعدد الأجهزة واختبارات الأجهزة الفعلية ما زالت مطلوبة قبل الاعتماد الكامل على المزامنة.


Current protocol (2026-11-01): local schema v8. Versioned CAS writes, persistent deletion tombstones, durable offline-change detection and explicit local/cloud conflict choices in Settings are implemented. See sync-conflicts.md. Earlier remaining-work notes describe the preceding stage. Physical browser/mobile acceptance remains outstanding.
