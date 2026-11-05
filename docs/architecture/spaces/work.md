# مساحة العمل

الحالة: المهام والمشاريع موجودة محليًا وسحابيًا، مع حقول التركيز داخل المهمة؛ ضمانات التعارض والعزل المحلي ما زالت مطلوبة. المسارات تحت /work: tasks, projects, focus, progress.

## المميزات الحالية

مهام بمواعيد وأولويات وحالات، سياق انتظار ومقاطعة، جلسات تركيز ووقت فعلي، مشاريع بخطوات وإجراء تالٍ، ومركز مشروع يضم روابط المستودع والتطوير وAPI والفرع وتعليمات التشغيل واحتياج VPN. هذه حقول وصفية؛ لا تضع أسرارًا أو tokens داخلها.

## البيانات

LifeTask مع spaceId=work يستخدم [عقد المهام المشترك](../shared-data.md). الحالة تختلف عن التركيز: مهمة IN_PROGRESS لا تعني أن مؤقتها يعمل الآن. actualMinutes مشتقة من مجموع focusSessions، وليست قيمة يدويّة مستقلة. waitingContext يحمل الشخص/السبب/بداية الانتظار/المتابعة/مهمة بديلة؛ interruptionContext يسجل التوقيت والسبب والشخص والمهمة السابقة.

LifeProject المحلي: id, spaceId, title, description, status (backlog/in_progress/waiting/completed), steps, nextActionId, nextActionTitle, targetDate, createdAt, completedAt؛ وسياق التطوير repositoryUrl/devUrl/apiUrl/branch/runCommand/requiresVpn/setupNotes. كل ProjectStep له id/title/order/isCompleted/completedAt.

Dexie.projects مشترك مع المنزل؛ spaceId=work يميّز مشاريع العمل. الحقل غير المحدد يعامل للتوافق كمشروع منزل. رابط task.projectId يجب أن يشير إلى مشروع في مساحة المهمة نفسها. steps → task lineage علاقة منطقية وليست FK محلية.

## Supabase والمزامنة

life_tasks أصبح يحفظ الحالة والجلسات والانتظار والمقاطعة وبيانات القرار والروابط. projects أصبح موجودًا مع space_id وسياق التطوير. المحولات موحدة للرفع الفردي والجماعي والقراءة، وتستخدم NULL لإزالة قيمة بدل ترك القيمة القديمة في السحابة. سجل التركيز له أيضًا localStorage عبر focusService، وحالة التركيز النشطة عبر focusEngine؛ الحالة النشطة ليست ضمن النسخ المحمولة.

## نقل .NET

افصل ProjectService وTaskService وFocusSessionService. احتفظ بمعرفات المشاريع والخطوات والمهام، واعتمد بدء/إيقاف الجلسة كعمليات لها operationId لمنع تكرار الوقت عند إعادة الطلب. لا تزامن مؤقتين نشطين على جهازين دون سياسة تعارض صريحة. حدّث الخطوة وإجراء المشروع التالي معًا في معاملة. روابط المشروع لا تمنح مستخدمًا آخر حق الوصول للمشروع.

المراجع: [lifeOs](../../../src/types/lifeOs.ts)، [tasks](../../../src/types/tasks.ts)، [focusEngine](../../../src/features/work/focus/focusEngine.ts)، [focusService](../../../src/features/work/focus/focusService.ts)، [projectQueries](../../../src/db/projectQueries.ts)، [syncEngine](../../../src/db/syncEngine.ts).
