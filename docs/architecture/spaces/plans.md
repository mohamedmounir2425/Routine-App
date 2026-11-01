# مساحة الخطط والأهداف

الحالة: موجودة محليًا، ولا توجد الجداول السحابية الخاصة بالخطط والمراحل. المسارات تحت /plans: tasks, list, goals, progress.

## المميزات والبيانات الحالية

أهداف طويلة المدى، مراحل مرتبة، مهام مرتبطة أو مستقلة، قوالب خطط، وحساب التقدم. الخطة ليست مساحة منفصلة جديدة، والمهمة المرتبطة بها تحتفظ بمساحتها الأساسية عند ظهورها في Today.

| الكيان | الحقول المحلية | السحابة |
|---|---|---|
| GoalPlan | id, title, category, description, targetDate, status, color, icon, createdAt, updatedAt | الكود يستهدف plans؛ غير موجود |
| PlanMilestone | id, planId, title, order, isCompleted, targetDate, completedAt | plan_milestones غير موجود |
| LifeTask | planId وmilestoneId وsourceType/sourceId؛ spaceId قد يظل health أو work مثلًا | life_tasks موجود بدون أعمدة الربط |

GoalPlan.category: career/faith/health/finance/personal. status: active/paused/completed. PlanMilestone.planId → GoalPlan.id علاقة منطقية محلية؛ task.planId/milestoneId تربط العمل التنفيذي بالخطة. لا توجد FK سحابية لهذه الروابط لغياب الجداول والأعمدة.

## قواعد ونواقص

لا تنشئ نسختين من نفس المهمة في الخطط ومساحتها الأصلية. الإكمال والتقدم يقرآن المصدر نفسه. الخطة المتوقفة لا تحذف سجل الإنجاز. شكل مؤشرات التقدم الحالي مستمد من المراحل والمهام المسجلة ولا يثبت وصولًا لنتيجة واقعية خارج التطبيق.

المزامنة الحالية تحاول رفع وسحب الخطط والمراحل، لكن غياب الجداول يمنع الاعتماد عليها. إخفاء أخطاء الطلبات يجعل واجهة نجاح المزامنة غير كافية لإثبات وصولها للموبايل.

## نقل .NET

خدمة GoalPlanning تملك الخطط والمراحل، وخدمة المهام تتحقق من مرجعها. يجب أن تنتمي المرحلة للخطة المختارة، وأن يملك المستخدم صلاحية الوصول للاثنين. حدد سلوك حذف/أرشفة خطة عليها مهام قبل التنفيذ؛ لا تحذف العمل المرتبط ضمنيًا. مشاركة هدف للمتابعة أو mentoring مطلب مقترح، لا تعني تلقائيًا مشاركة مهام العمل أو بقية الأهداف. التقدم يعاد حسابه من السجلات بعد النقل.

المراجع: [lifeOs](../../../src/types/lifeOs.ts)، [PlansSpace](../../../src/features/plans/PlansSpace.tsx)، [goalPlanQueries](../../../src/db/goalPlanQueries.ts)، [syncEngine](../../../src/db/syncEngine.ts).
