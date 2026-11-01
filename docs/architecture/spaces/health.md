# مساحة الصحة

الحالة: أدوات محلية موجودة، ومزامنة سحابية جزئية. المسارات: /health و/tasks و/exercises و/plans و/progress تحتها.

## المميزات الحالية

مكتبة تمارين ومفضلة، روتينات مخصصة، خطط تدريب وجدول أسبوعي، تشغيل جلسة وراحة، سجل الإنجاز وتقييم الألم والصعوبة، مهام صحة عادية، ومواعيد تمرين متعددة تظهر في Today. خطط التدريب غير أهداف الحياة الموجودة في مساحة الخطط.

## البيانات والعلاقات

| الكيان المحلي | أهم الحقول والعلاقة | Supabase |
|---|---|---|
| Exercise | id, name, arabicName, category, durationSeconds, reps, restAfterSeconds, instructions, precautions, targetMuscles, videoUrl, youtubeUrl, animationSlug, isFavorite, createdAt | لا يوجد |
| Routine | id, name, description, exerciseIds, totalEstimatedMinutes, level, tag, flags, prescriptions, customExerciseConfigs | custom_routines مع وصفات التمرين وإعدادات الجلسة |
| WeeklyScheduleItem | dayOfWeek 0–6، routineId أو يوم راحة، weekNumber/sessionCode | weekly_schedule |
| WorkoutLog | routineId/name، completedAt، durationMinutes، exercisesCompleted/totalExercises، week/session، تقييمات وملاحظات | workout_logs |
| WorkoutScheduleEntry | id, dayOfWeek, routineId, scheduledTime, sessionLabel, durationMinutes, isEnabled | workout_schedules موجود |
| LifeTask | spaceId=health؛ عقد المهام المشترك | life_tasks مع حقول المهمة الكاملة |

العلاقات exerciseIds → exercises وroutineId → routines منطقية محليًا؛ لا توجد FK سحابية وظيفية تضمنها في الجداول الحالية. profiles يحدد الخطة التدريبية والأسبوع والمستوى وبعض إعدادات اللاعب. تعريفات الحقول الكاملة في [types](../../../src/types/index.ts) و[lifeOs](../../../src/types/lifeOs.ts). الأعمدة السحابية وأنواعها في [اللقطة](../supabase-current.md).

## القواعد والتكامل

الأحد=0 والسبت=6. الجدول الأسبوعي ومواعيد التمرين ليسا موعدًا منفردًا بتاريخ محدد. احتفظ بتاريخ السجل الفعلي عند عرض التقدم. لا تعِد زرع البيانات بطريقة تمسح تمارين مخصصة أو المفضلة أو جدول المستخدم. Today يعرض الجلسات ويطلق اللاعب ويعرض مهام الصحة من مصدرها نفسه.

## النواقص ونقل .NET

مطلوب تمثيل التعديلات والمفضلة ومواعيد التمرين في عقد backend واضح، وتحديد نسخة بيانات التمارين الابتدائية. custom_routines أصبح يغطي حقول Routine المستخدمة في الروتين المخصص؛ التمارين المخصصة والمفضلة ما زالت بحاجة لتصميم سحابي مستقل. احتفظ بمعرفات الروتينات والتمارين عند النقل، ولا تنشئ مكتبة مكررة لكل استيراد. افصل خدمة ExerciseCatalog عن WorkoutScheduling وعن WorkoutHistory؛ طبّق التحقق من الملكية والمراجع والمدة في الخادم. لا توسع بيانات الصحة إلى مشاركة تلقائية مع الأسرة.

المصادر: [App routes](../../../src/App.tsx)، [planQueries](../../../src/db/planQueries.ts)، [player](../../../src/features/player/WorkoutPlayer.tsx)، [المزامنة](../../../src/db/syncEngine.ts).
