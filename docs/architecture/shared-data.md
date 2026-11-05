# البنية والبيانات المشتركة

## الموجود

الواجهة React + TypeScript. التخزين المحلي Dexie فوق IndexedDB بمخطط version 9: قاعدة لكل حساب ووضع بدون حساب مستقل. RoutineAppDB أصبح مصدر النسخة القديمة المحفوظ، وليس قاعدة التشغيل المشتركة. التطبيق PWA، لكن تثبيته لا يجعل المزامنة تلقائية أو يضمن تشغيل مهام في الخلفية وهو مغلق.

المراجع: [تعريف قاعدة البيانات](../../src/db/database.ts)، [الأنواع](../../src/types/index.ts)، [المهام](../../src/types/tasks.ts)، [الكيانات الممتدة](../../src/types/lifeOs.ts)، [المزامنة](../../src/db/syncEngine.ts)، [الحسابات](../../src/context/AuthContext.tsx).

## خريطة التخزين

| Dexie | مفتاح محلي | Supabase الحالي |
|---|---|---|
| exercises | id | لا يوجد جدول، بيانات ابتدائية وتعديلات محلية |
| routines | id | custom_routines للروتينات المخصصة، مع prescriptions وإعدادات الجلسة |
| weeklySchedule | dayOfWeek | weekly_schedule، مفتاح سحابي id مختلف |
| workoutLogs | id | workout_logs |
| settings | current_settings | profiles بمفتاح هو معرّف الحساب |
| azkarLogs | id | azkar_logs |
| tasks | id | life_tasks، مع metadata التخطيط والتركيز |
| projects | id | projects |
| plans | id | plans |
| planMilestones | id | plan_milestones |
| workoutSchedules | id | workout_schedules |
| dayPlans | date | day_plans؛ مفتاح سحابي يضم الحساب والتاريخ |
| recipes | id | recipes؛ اقتراحات الأكل وتفاصيلها مع الإصدارات والحذف |
| pendingSync | رقم تلقائي | طابور محلي، ليس جدول بيانات ينقل بين الأجهزة |

## المهام المشتركة بين المساحات

كل مساحة تستخدم LifeTask؛ spaceId واحد من worship/health/work/home/plans. لا تنشأ نسخة أخرى من المهمة لمجرد عرضها في Today. يمكن ربطها بخطة مع الاحتفاظ بمساحتها الأساسية.

الحقول المحلية:

- الهوية والمحتوى: id, spaceId, title, description, createdAt, updatedAt.
- التخطيط: dueDate كتاريخ محلي، scheduledTime كوقت محلي، estimatedMinutes، priority: high/medium/low.
- الحالة: status اختياري TODO/IN_PROGRESS/WAITING/DONE، وisCompleted للتوافق، وcompletedAt.
- المصدر: sourceType: manual/plan/project/routine، sourceId, projectId, planId, milestoneId.
- التكرار: isRecurring، recurrenceRule: daily/weekdays/weekly، recurringCompletionDates.
- التركيز: focusSessions، actualMinutes المشتقة منها، waitingContext، interruptionContext.
- القرار اليومي: deadlineAt كتوقيت تسليم ثابت، commitment: must/should/could، goalImpact، dependsOnTaskIds.

جدول life_tasks أصبح يحتوي حقول التخطيط والتركيز والروابط والتكرار وتوقيت التحديث. taskToCloud/taskFromCloud موحدان للرفع الفردي والجماعي والقراءة، مع ترميز NULL الصريح للإزالة وclient_data_version للتوافق مع الصفوف القديمة. projectToCloud/projectFromCloud يحافظان على spaceId وسياق التطوير، وروتينات الصحة تحتفظ بـprescriptions وإعدادات جلسة الخطة. profiles أصبح يخزن today_preferences. راجع [اللقطة المحدثة](supabase-current.md) و[المحوّلات](../../src/db/cloudMappers.ts).

قواعد الخدمة المحلية: عنوان غير فارغ، تاريخ ووقت صحيحان، مدة 1–1440 دقيقة إن حُددت، مشروع تابع لنفس مساحة المهمة، وخطة موجودة، ومنع دائرة في الاعتماديات. saveTask يوفق status مع isCompleted ويحسب actualMinutes من الجلسات. هذه قواعد يجب إعادة تنفيذها على الخادم، لا الاعتماد على تحقق الواجهة فقط.

## الحسابات والصلاحيات

Supabase Auth يدير الحسابات والجلسات. profiles.id يشير إلى auth.users.id؛ باقي الجداول الحالية تملك user_id يشير إليه. سياسات RLS الحالية تعتمد ملكية الحساب؛ تفاصيلها في [اللقطة](supabase-current.md). لم تختبر عمليات حسابين ضمن هذه المرحلة.

قاعدة Dexie والتفضيلات والطوابير الآن منفصلة حسب الحساب، وتبديل الهوية يعيد تحميل التطبيق بعد إيقاف الواجهة السابقة. البيانات القديمة تحفظ في وضع بدون حساب وأرشيف مستقل ولا تنسب تلقائيًا لأي حساب. راجع [تفاصيل العزل والترحيل](account-workspaces.md). RLS يبقى مسؤولًا عن التفويض السحابي.

المشاركة الانتقائية بين الزوجين **مقترحة وغير منفذة**: صلاحية على مساحة أو مكون أو عنصر، مع عرض/تعديل/متابعة، وخصوصية افتراضية. الإنجاز المشترك يمكن أن يراه الطرفان، لكن ترتيب اليوم الشخصي يظل لصاحبه. التفويض يجب أن ينفذ في backend لكل عملية، وليس بإخفاء أزرار فقط.

## المزامنة الحالية وحدودها

AuthContext يفرغ الطابور ثم يشغل مزامنة كاملة. المزامنة الكاملة تسحب السحابة إلى المحلي ثم ترفع المحلي. بعض مسارات الحفظ الفردية تدفع التعديل أو تضعه بالطابور عند الفشل. الطابور يحتوي table/entityId/action/data/userId/timestamp/retryCount/status ومعلومات إعادة المحاولة.

تحديث أمان المزامنة: الطلبات الجماعية أصبحت تفشل صراحة عند رفض الخادم، ويجري فحص جميع الجداول المطلوبة وقراءة الصفحات قبل أي كتابة محلية. تطبيق السحب يتم في معاملة واحدة، ويرفض إذا تغيرت البيانات المحلية أثناء القراءة أو بقيت تعديلات مؤجلة للحساب. الطابور مفهرس بحسب الحساب وتظل العمليات الفاشلة ضمن العدد غير المتزامن، وإقرار رفع قديم لا يمسح عملية أحدث.

تم استكمال الجداول والحقول الأساسية وتوحيد محولات المهام والمشاريع والروتينات وإضافة مزامنة dayPlans وتفضيلات Today. كل حفظ فردي يمر الآن بالطابور قبل أي طلب شبكة، بما فيه الحفظ المتصل. تم عزل بيانات الحسابات المحلية؛ ما زال مطلوبًا عقد تعارض خادمي ونشر الحذف بين الأجهزة. السحب لا يحسم نسخة أحدث بين تعديلين سابقين على جهازين، وتوقيت الطابور ليس إصدارًا موثوقًا للسجل. أي جدول مطلوب يفشل الوصول إليه يوقف السحب برسالة واضحة. مؤشر نجاح آخر محاولة ليس إثباتًا لتطابق كل بيانات الجهازين أو اكتمال كل أنواع البيانات.

## JSON والعمل دون السحابة

[backup.ts](../../src/db/backup.ts) يصدر format v3 ويقبل v1/v2/v3. يشمل 13 جدولًا محمولًا من القائمة السابقة باستثناء pendingSync، مع قائمة مسموحة من مفاتيح localStorage للصلاة والقرآن والتسبيح والتفضيلات وسجل التركيز. يستبعد توكنات الدخول وحالة التركيز الجارية وطابور الجهاز ونسخة الأمان نفسها.

المعاينة تعرض السجلات الجديدة والمختلفة. الاستيراد يضيف أو يستبدل بالمعرف حسب اختيار المستخدم، ولا يحذف الغائب من الملف. افتراضي الشاشة يحتفظ بالموجود؛ استدعاء الدالة البرمجية القديم افتراضيه use-file للتوافق. المعاينة لا تحكم أي نسخة أحدث.

قبل الاستيراد تحفظ أحدث نسخة أمان فقط في localStorage تحت lifeos_pre_import_backup. إذا تعذر حفظها يتوقف الاستيراد. يمكن تنزيلها من الإعدادات، لكنها على الجهاز نفسه وليست حماية من فقد الجهاز. ملفات أكبر من 25 MiB ترفضها الشاشة. البيانات المستوردة لا تُرفع مباشرة من دالة الاستيراد، لكن مزامنة لاحقة للحساب قد تتعامل معها؛ تحتاج ملكية البيانات مراجعة عند نقل ملف بين حسابين، ويظهر اختلاف مصدر النسخة قبل التأكيد.

النسخة JSON ليست نسخة كاملة من backend: لا تشمل حسابات Auth أو سياسات RLS أو الدوال أو محتوى Storage. روابط الصور لا تضمن حفظ الصورة نفسها. نقل الملف للموبايل يدوي ولا يدمج تعديلات جهازين تلقائيًا.


Current protocol (2026-11-01): local schema v9. Versioned CAS writes, persistent deletion tombstones, durable offline-change detection and explicit local/cloud conflict choices in Settings are implemented. See sync-conflicts.md. Earlier remaining-work notes describe the preceding stage. Physical browser/mobile acceptance remains outstanding.
