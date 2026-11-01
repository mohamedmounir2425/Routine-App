# مساحة العبادة

الحالة: موجودة محليًا، ومزامنة جزء من الأذكار والمهام فقط. المسارات تحت /worship: tasks, prayers, azkar, quran, tasbeeh, progress.

## المميزات الحالية

متابعة الصلاة والنوافل، حساب أوقات الصلاة بحسب المدينة أو الإحداثيات، مشغل الأذكار وعدّاد التسبيح، ورد القرآن والموضع الحالي، مهام عبادة يدوية، وعرض التقدم وتجميع اليوم.

## التخزين الحالي

| البيانات | المصدر المحلي | السحابة الحالية |
|---|---|---|
| الصلاة والنوافل | localStorage: routine_prayers_YYYY-MM-DD مع لاحقة _nawafil | لا يوجد جدول |
| موقع الصلاة | routine_prayer_city وroutine_prayer_coords | لا يوجد |
| ورد القرآن والهدف والعلامة | مفاتيح routine_quran_* | لا يوجد |
| التسبيح | routine_tasbeeh_today | لا يوجد |
| سجل الأذكار | Dexie.azkarLogs | public.azkar_logs |
| المهام | Dexie.tasks مع spaceId=worship | public.life_tasks مع حقول المهمة الكاملة |
| نصوص الأذكار | ملف azkar.json ضمن التطبيق | ليست بيانات مستخدم سحابية |

AzkarLog: id, date, categoryKey, categoryArabic, totalDhikr, completedDhikr, isFullyCompleted, durationSeconds, completedAt. المقابلات السحابية snake_case مع user_id؛ [الأعمدة](../supabase-current.md). categoryKey يشمل morning/evening/waking/sleeping/after_prayer/ruqyah/misc/all، ولا توجد FK لفئة الأذكار.

## قواعد وحدود

Today يقرأ السجلات ومفاتيح اليوم نفسها؛ إكمال الصلاة أو زيادة صفحات القرآن ليست LifeTask جديدة. اليوم تاريخ محلي، والتوقيت الفعلي للسجل ISO. تغيّر المدينة أو المنطقة الزمنية يجب ألا يعيد نسبة إنجاز الأمس لليوم. وجود قيمة tasbeeh_today لا يعني وجود تاريخ تسبيح كامل محفوظ. النسخة JSON تنقل المفاتيح المدعومة، وليست مزامنة لهذه الأجزاء.

## المقترح عند استكمال backend أو نقله

خدمات منفصلة: PrayerDailyRecord، QuranDailyProgress/Bookmark، TasbeehDailyRecord، AzkarSessionLog. الأسماء تصميم مقترح وليست جداول موجودة. استخدم هوية المستخدم مع date ومفتاح النشاط لمنع تكرار إنجاز يوم واحد، ومعرف جلسة لسجلات الأذكار. تظل نصوص الأذكار وبيانات حساب المواقيت موارد مستقلة عن سجلات المستخدم. الخصوصية افتراضية، والمشاركة تحتاج اختيارًا صريحًا.

المراجع: [الأنواع](../../../src/features/worship/types.ts)، [PrayerTracker](../../../src/features/worship/prayers/PrayerTracker.tsx)، [QuranTracker](../../../src/features/worship/quran/QuranTracker.tsx)، [tasbeehQueries](../../../src/features/worship/tasbeeh/tasbeehQueries.ts)، [backup](../../../src/db/backup.ts).
