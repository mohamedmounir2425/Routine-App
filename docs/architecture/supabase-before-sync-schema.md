# لقطة Supabase قبل استكمال جداول المزامنة

لقطة تاريخية من 2026-11-01 قبل migration complete_core_sync_schema؛ راجع supabase-current.md للبنية الحالية. المصدر: قراءة metadata مباشرة من مشروع LifeOS. هذه لقطة توثيقية وليست migration أو نسخة بيانات أو تفريغًا كاملًا لقاعدة البيانات.

الجداول الستة التالية موجودة في public، وRLS مفعّل عليها جميعًا. كل جدول له primary key باسم id. نوع id هو uuid في profiles وtext في باقي الجداول. كل علاقات FK المرصودة تشير إلى auth.users(id)، ولا توجد بينها علاقات FK إلى الجداول الوظيفية الأخرى في هذه اللقطة.

## public.profiles

| العمود | النوع | يقبل null | القيمة الافتراضية |
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

العلاقات:

- profiles_id_fkey: id → auth.users(id).

## public.workout_logs

| العمود | النوع | يقبل null | القيمة الافتراضية |
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

| العمود | النوع | يقبل null | القيمة الافتراضية |
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

العلاقات:

- custom_routines_user_id_fkey: user_id → auth.users(id).

## public.weekly_schedule

| العمود | النوع | يقبل null | القيمة الافتراضية |
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

| العمود | النوع | يقبل null | القيمة الافتراضية |
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

| العمود | النوع | يقبل null | القيمة الافتراضية |
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

العلاقات:

- life_tasks_user_id_fkey: user_id → auth.users(id).

## سياسات الوصول المرصودة

الأدوار المحددة حاليًا هي public. هذا لا يعني إتاحة كل الصفوف للجميع؛ الشرط هو الذي يقيّد الوصول.

| الجداول | العملية | USING | WITH CHECK الصريح |
|---|---|---|---|
| workout_logs, custom_routines, weekly_schedule, azkar_logs, life_tasks | ALL | auth.uid() = user_id | غير محدد |
| profiles | SELECT | auth.uid() = id | غير محدد |
| profiles | UPDATE | auth.uid() = id | غير محدد |
| profiles | INSERT | غير محدد | auth.uid() = id |

عدم وجود WITH CHECK صريح لا يكفي وحده للحكم بوجود ثغرة؛ يجب مراعاة قواعد Postgres للسياسات واختبار العمليات بحسابين. هذه مراجعة metadata وليست اختبار اختراق أو إثباتًا لاكتمال العزل.

## إنشاء ملف الحساب

يوجد trigger باسم on_auth_user_created بعد INSERT على auth.users، ينفذ public.handle_new_user(). الدالة SECURITY DEFINER، وتضيف profiles.id من NEW.id وuser_name من full_name أو البريد الإلكتروني. الحقل full_name يستخدم للعرض هنا وليس للتفويض.

ملاحظات فحص Supabase: search_path غير مثبت، وصلاحيات EXECUTE للدالة تحتاج مراجعة. لأنها ترجع trigger، لا يصح افتراض إمكانية استغلالها كـRPC عادي دون اختبار. لا تغير نوع الأمان عشوائيًا حتى لا يتعطل إنشاء الحساب.

## حدود اللقطة

لا تحتوي هذه الوثيقة على بيانات مستخدمين أو مفاتيح أو كلمات مرور. لم تُفحص هنا جميع إعدادات Auth وStorage وRealtime والمنح والفهارس والامتدادات. لا تستخدمها كبديل عن schema dump قابل للاستعادة. جداول projects وplans وplan_milestones وworkout_schedules وday_plans غير موجودة ضمن public وقت الفحص.
