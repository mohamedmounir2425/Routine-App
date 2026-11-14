# عقد المرحلة 0 + بطاقة العمل الأولى + عقد المشتريات المستقل

التاريخ: 2026-11-07  
الحالة: **مسودة عقد تنفيذية للمراجعة والاعتماد (لم يتغير أي كود أو Types أو SQL في هذه الخطوة)**  
المرجع الأعلى: يكمل هذا المستند [مراجعة المنزل وToday وخطة التعاون](home-today-review.md) ويحولها إلى عقود حقول ودوال وحدود ملفات بالاسم.

---

## الجزء الأول: عقد المرحلة 0 (العقود المشتركة للمهام، المشاريع، اختيار اليوم، والنطاق)

### 1. قاعدة الحالة والانتظار والتأجيل والتواريخ (Orthogonal Task & Project Attributes)

**القاعدة الحاكمة:** الانتظار له مصدر واحد فقط هو `status = 'WAITING'` (مع `waitingContext` في المهمة، و`status = 'waiting'` في المشروع). **لا ننشئ حقل `readiness` يكرر حالة الانتظار أو الإنجاز.**

#### أ) الحقول المضافة على `LifeTask` (`src/types/tasks.ts` $\leftrightarrow$ `public.life_tasks`)

| الحقل في TypeScript | العمود في Supabase (`life_tasks`) | النوع والقيود | الدلالة والقاعدة |
|---|---|---|---|
| `status` *(موجود)* | `status` *(موجود)* | `'TODO' \| 'IN_PROGRESS' \| 'WAITING' \| 'DONE'` | مصدر الحقيقة الوحيد لحالة التنفيذ والانتظار. عند `WAITING` يستخدم `waitingContext` (`waitingOn`, `waitingReason`, `followUpDate`). |
| `dueDate` *(موجود)* | `due_date` *(موجود)* | `YYYY-MM-DD \| undefined` | يوم مخطط للتنفيذ (Planned Date). ليس موعد تسليم نهائيًا، وليس تاريخ مراجعة فكرة. |
| `deadlineAt` *(موجود)* | `deadline_at` *(موجود)* | `ISO timestamptz \| undefined` | موعد تسليم ثابت صلب (Hard Deadline). يظل ظاهرًا في Today عند حلوله أو تجاوزه حتى لو لم يُختر يدويًا. |
| `availableFrom` *(جديد)* | `available_from` *(جديد)* | `date (YYYY-MM-DD) NULL` | بداية الإتاحة للتنفيذ. قبل هذا التاريخ (`availableFrom > targetDate`) لا تُعتبر المهمة متاحة للتنفيذ ولا تُقترح في Today. |
| `isSomeday` *(جديد)* | `is_someday` *(جديد)* | `boolean NOT NULL DEFAULT false` | يميز «الفكرة المؤجلة / لاحقًا» عن المهام الجاهزة. المهمة التي تحمل `isSomeday = true` لا تدخل تجميع Today تلقائيًا ولا تُوسم بالتأخر (`overdue`). |
| `reviewDate` *(جديد)* | `review_date` *(جديد)* | `date (YYYY-MM-DD) NULL` | موعد تذكير لمراجعة فكرة مؤجلة أو مهمة. عند حلول `reviewDate <= today` تظهر في فلتر «للمراجعة» داخل المساحة، **ولا تتحول إلى `overdue` أو التزام في Today**. |
| `taskCategory` *(جديد)* | `task_category` *(جديد)* | `'general' \| 'maintenance' NULL` | تصنيف منظم للمهمة بدل الاعتماد الدائم على كلمات العنوان. يستمر `isMaintenanceTask` كـ fallback للقراءة فقط للسجلات القديمة التي قيمتها `NULL`. |
| `householdId` *(جديد - تأسيس)* | `household_id` *(جديد - تأسيس)* | `uuid NULL` | معرّف البيت المشترك. `NULL` يعني موردًا شخصيًا خالصًا للمالك (`user_id`). لا يتحول السجل القديم لـ `household_id` تلقائيًا. |
| `visibility` *(جديد - تأسيس)* | `visibility` *(جديد - تأسيس)* | `'private' \| 'household' NOT NULL DEFAULT 'private'` | في المهام الجديدة الافتراضي `'private'`. حتى لو وُجد `household_id`، العنصر `'private'` لا يراه ولا يبحث فيه إلا منشئه/مالكه. |
| `assignedUserId` *(جديد - تأسيس)* | `assigned_user_id` *(جديد - تأسيس)* | `uuid NULL` | معرّف المستخدم المكلف فقط (UUID صحيح أو `NULL`). **ممنوع تخزين كلمات مثل `'both'`**. التكليف لا يمنح صلاحية المشاهدة ضمنيًا. |

> **ملاحظة التوافق (`client_data_version`):** في `cloudMappers.ts`، يرتفع `client_data_version` إلى `2` عند إضافة الأعمدة الجديدة في قاعدة البيانات. الصفوف القادمة من السحابة بإصدار `< 2` تحافظ على القيم المحلية للحقول الجديدة إن لم تكن موجودة في السحابة، مع إرسال `null` الصريح عند مسح أي حقل اختياري.

#### ب) الحقول والقواعد على `LifeProject` (`src/types/lifeOs.ts` $\leftrightarrow$ `public.projects`)

| الحقل | النوع | القاعدة |
|---|---|---|
| `status` *(موجود)* | `'backlog' \| 'in_progress' \| 'waiting' \| 'completed'` | المشاريع في حالة `'backlog'` (مؤجلة) أو `'waiting'` (معلقة/انتظار) **لا تدفع خطوتها التالية (`nextAction`) إلى Today أو المقترحات الجاهزة أبدًا**. |
| `reviewDate` *(جديد)* | `string \| undefined` (`YYYY-MM-DD`) | موعد مراجعة دوري اختياري للمشروع (خصوصًا لمشاريع `backlog` مثل «تجديد الركنة»)، يظهر في قسم مراجعة المنزل دون إغراق Today. |
| `householdId` / `visibility` *(تأسيس)* | `string \| undefined` / `'private' \| 'household'` | نفس عقد الخصوصية والنطاق في المهام (الافتراضي `'private'`). |

---

### 2. عقد عناصر خطة اليوم وهويتها الكاملة (`DayPlan` & `DayPlanSelectedItem`)

**القاعدة الحاكمة:** اختيار عنصر لليوم يتبع المستخدم (`userId`) وتاريخ يومه (`date`). كل عنصر مختار له هوية مصدر كاملة (`refKey`) تمنع الخلط بين مهمة منفردة، وخطوة مشروع بعينها، وحدوث روتين متكرر في تاريخ محدد.

#### أ) تعريف الهوية الكاملة (`DayPlanSelectedItem`)

```ts
export type DayPlanSourceType = 'task' | 'project_step' | 'routine_occurrence';

export type DayPlanSelectedItem =
  | {
      /** Canonical key: `task:${taskId}` */
      refKey: string;
      sourceType: 'task';
      taskId: string;
      position: number;
      isEssential?: boolean;
      addedAt: string; // ISO timestamp
    }
  | {
      /** Canonical key: `project_step:${projectId}:${stepId}` */
      refKey: string;
      sourceType: 'project_step';
      projectId: string;
      stepId: string;
      position: number;
      isEssential?: boolean;
      addedAt: string;
    }
  | {
      /** Canonical key: `routine_occurrence:${taskId}:${occurrenceDate}` */
      refKey: string;
      sourceType: 'routine_occurrence';
      taskId: string;
      occurrenceDate: string; // YYYY-MM-DD (must match DayPlan.date)
      position: number;
      isEssential?: boolean;
      addedAt: string;
    };

export interface DayPlan {
  date: string; // YYYY-MM-DD
  availableMinutes: number;
  endTime: string; // HH:mm
  /** Preserved for backward compatibility with existing decision engine & cloud rows */
  essentialTaskIds: string[];
  /** Ordered personal selection of items across spaces for this date */
  selectedItems?: DayPlanSelectedItem[];
  updatedAt: string;
}
```

#### ب) قواعد السلوك والترحيل لـ `DayPlan`
1. **عدم التكرار:** `refKey` فريد داخل نفس خطة اليوم `(userId, date)`.
2. **الإضافة لليوم (`selectForDay`):**
   - تضيف `DayPlanSelectedItem` إلى `selectedItems` لليوم المحدد (أو تنشئ سجل `DayPlan` بقيم افتراضية `availableMinutes: 120, endTime: '22:00'` إن لم يكن موجودًا).
   - **لا تعدل** `dueDate` أو `deadlineAt` على المهمة الأصلية.
3. **الإزالة من اليوم (`removeFromDay`):**
   - تحذف العنصر صاحب `refKey` من `selectedItems` (ومن `essentialTaskIds` إن كان فيها).
   - **لا تحذف** المهمة الأصلية ولا المشروع، **ولا تغير** `deadlineAt` أو `dueDate`.
   - إذا كانت للمهمة `deadlineAt` يحل اليوم، تظل ظاهرة في تحذيرات الموعد الثابت (Hard Deadline) حتى لو أُزيلت من الاختيار اليدوي.
4. **إنجاز خطوة المشروع (`project_step`):**
   - عند إتمام خطوة مشروع مختارة في Today، يتم استدعاء `completeProjectStep(projectId, stepId)` على المشروع المصدر.
   - يتحدث المشروع لتصبح `step.isCompleted = true` ويتقدم `project.nextActionId` للخطوة التالية داخل المشروع، **ولكن `selectedItems` في `DayPlan` تحتفظ بـ `project_step:${projectId}:${stepId}` كمكتملة لهذا اليوم، ولا تضيف الخطوة التالية (`nextActionId` الجديد) تلقائيًا لليوم**.
5. **إنجاز حدوث الروتين (`routine_occurrence`):**
   - يقرأ ويكتب في `task.recurringCompletionDates` لتاريخ `occurrenceDate` فقط، فلا يختلط إنجاز اليوم بإنجاز الأمس أو الغد.
6. **ترحيل `essentialTaskIds` الحالي:**
   - دالة ترحيل/قراءة متوافقة (`normalizeDayPlan`): أي معرّف موجود في `essentialTaskIds` وليس له تمثيل في `selectedItems` يُحوّل تلقائيًا عند القراءة والحفظ إلى عنصر `DayPlanSelectedItem` مع `isEssential: true`، مع استمرار مزامنة `essential_task_ids` للتوافق الخلفي.
7. **التمثيل السحابي (`public.day_plans`):**
   - يضاف العمود `selected_items jsonb not null default '[]'::jsonb` إلى `public.day_plans` مع Trigger تحقق (`validate_day_plan_selected_items`) يفحص شكل العناصر وتفرد `refKey` وصحة `sourceType`. (وبذلك يستفيد مباشرة من `sync_apply_mutation` و`sync_read_snapshot` و`BACKUP_TABLES.dayPlans` الحالية دون كسر عقد المزامنة).

---

## الجزء الثاني: بطاقة العمل الأولى (Card 1 Specification)

### العنوان
**اختيار مهام المنزل لليوم دون إدخال مخزن الأعمال كله، وفصل المؤجل والانتظار عن العمل الجاهز.**

### 1. التدفق المستهدف (User Flow)
1. **حفظ فكرة مؤجلة في المنزل:** المستخدم يضيف «تجديد الركنة» (مشروع في `backlog` مع `reviewDate` اختياري) أو «شراء سجاد» (مهمة مع `isSomeday = true` و`reviewDate` اختياري) $\leftarrow$ تُحفظ في مساحة المنزل تحت تبويب/فلتر «لاحقًا / للمراجعة» **ولا تظهر في أجندة Today ولا تُحسب متأخرة**.
2. **حفظ مهمة منزل جاهزة غير مؤرخة:** المستخدم يضيف «كي القميص» (مهمة منزل، مدتها 15 دقيقة، بدون `dueDate`) $\leftarrow$ تبقى في «جاهز للتنفيذ» داخل مساحة المنزل، **ولا تدخل التزامات Today تلقائيًا**، لكن يمكن أن تظهر ضمن «مقترحات مناسبة (حد أقصى 3)».
3. **الاختيار لليوم من المساحة أو من Today:**
   - من داخل مساحة المنزل (`/home/tasks` أو `/home/projects`): زر **«+ أضف ليومي»** على المهمة الجاهزة أو على خطوة محددة من مشروع نشط.
   - من داخل `/today`: زر **«اختيار من المساحات»** يفتح نافذة اختيار (Picker) تعرض المهام الجاهزة وخطوات المشاريع الجاهزة عبر المساحات مع بحث وفلترة بالمساحة والمدة («سريعة $\le 15$ د»).
4. **الإزالة من اليوم دون فقدان:** المستخدم يضغط «إزالة من يومي» على «كي القميص» في Today $\leftarrow$ تختفي من قسم «مختار ليومي» في Today، وتظل موجودة وسليمة في `/home/tasks`.
5. **إنجاز خطوة مشروع:** المستخدم يختار خطوة «قياس مكان الشفاط» من مشروع «تركيب شفاط» ليومه، وينجزها من Today $\leftarrow$ تُسجل مكتملة في المشروع وفي Today، **ولا تنزل الخطوة التالية («شراء الشفاط») في Today تلقائيًا**.

### 2. قواعد تجميع Today المعدلة (`todayAggregator.ts` & `todayDecisionEngine.ts`)

| القسم في Today | ما الذي يدخل فيه؟ | ما الذي يُمنع من دخوله؟ |
|---|---|---|
| **1. مختار ليومي (`selected_for_today`)** | كل عنصر في `dayPlan.selectedItems` لتاريخ اليوم (`task`, `project_step`, `routine_occurrence`). | أي مهمة أو خطوة مشروع لم يخترها المستخدم، حتى لو كانت بدون تاريخ. |
| **2. مواعيد والتزامات مستحقة اليوم (`scheduled_and_due`)** | • الصلوات والأذكار والورد والتمارين المجدولة اليوم.<br>• المهام ذات `deadlineAt` اليوم أو متأخرة.<br>• المهام ذات `dueDate <= today` (بشرط `!isSomeday` و`status !== 'WAITING'` و`!isShoppingTask`).<br>• الروتين المتكرر المستحق اليوم وفق `isSpaceTaskDue`.<br>• متابعة الانتظار التي حل موعدها (`status === 'WAITING' && waitingContext.followUpDate <= today`). | • المهام غير المؤرخة (`!dueDate && !deadlineAt && !isRecurring`) غير المختارة.<br>• المشتريات (`isShoppingTask`).<br>• الأفكار المؤجلة (`isSomeday === true`).<br>• المهام ذات `availableFrom > today`.<br>• مشاريع `backlog` و`waiting` وخطوات المشاريع غير المختارة. |
| **3. مقترحات مناسبة (`suggestions` — حد أقصى 3)** | ترشيحات محدودة من المهام الجاهزة (`status !== 'WAITING'`, `!isSomeday`, `!availableFrom \|\| availableFrom <= today`) أو `nextAction` لمشروع `in_progress` لم تُختر بعد لليوم، مع عرض سبب الترشيح وزر «أضف ليومي». | لا تدخل في حساب نسبة إنجاز اليوم (`completionRate`) ولا تُعرض كالتزامات متأخرة. |

### 3. الدوال والخدمات المطلوبة في البطاقة الأولى
في `src/features/today/todayPlanningService.ts`:
- `addItemToDayPlan(date: string, item: Omit<DayPlanSelectedItem, 'position' | 'addedAt'>): Promise<DayPlan>`
- `removeItemFromDayPlan(date: string, refKey: string): Promise<DayPlan>`
- `reorderDayPlanItems(date: string, orderedRefKeys: string[]): Promise<DayPlan>`
- `isItemSelectedForDay(plan: DayPlan | undefined, refKey: string): boolean`
- `normalizeDayPlan(plan: DayPlan): DayPlan` (ترحيل وتوحيد `essentialTaskIds` مع `selectedItems`)

### 4. معايير القبول والاختبارات (Acceptance Criteria — Card 1)
1. إضافة مهمة منزل بدون `dueDate` لا تزيد عداد مهام Today ولا تظهر في أقسام الالتزامات؛ تظهر فقط في المنزل وفي منتقي «اختيار من المساحات» (أو في الـ 3 مقترحات).
2. إضافة مهمة بـ `isSomeday: true` أو مشروع `status: 'backlog'` أو مهمة `status: 'WAITING'` (قبل موعد المتابعة) لا تظهر كعمل جاهز في Today ولا في المقترحات.
3. اختيار مهمة أو خطوة مشروع عبر «أضف ليومي» يظهرها فورًا في Today، وإزالتها من اليوم تبقيها في المنزل دون تغيير `dueDate` أو `deadlineAt`.
4. إكمال خطوة مشروع مختارة في Today يكمل الخطوة في `db.projects` ولا يضيف الخطوة التالية لخطة اليوم تلقائيًا.
5. المهام ذات `deadlineAt` اليوم أو الفائتة تظل ظاهرة ومحمية في Today حتى لو لم تكن ضمن `selectedItems`.
6. المزامنة (`syncEngine` / `cloudMappers`) والنسخ الاحتياطي (`backup.ts`) تحفظ وتستعيد الحقول الجديدة و`selectedItems` بدون فقد أو تكرار.

---

## الجزء الثالث: عقد المشتريات المستقل (موثق للمراجعة المبكرة — يُنفذ في البطاقة الثانية Card 2)

> **حدود التنفيذ:** يُراجع هذا العقد الآن لضمان توافق التصميم، لكن تنفيذه الكامل (جدول `shopping_items` و`stock_receipts` وواجهة `ShoppingView`) سيكون في **البطاقة رقم 2** مباشرة بعد البطاقة الأولى، بينما تكتفي البطاقة الأولى باستبعاد `isShoppingTask` من إغراق Today.

### 1. نموذج بيانات عنصر المشتريات (`ShoppingItem` $\leftrightarrow$ `public.shopping_items`)

| الحقل | النوع والقيود | الوصف والقاعدة |
|---|---|---|
| `id` | `text PK` | معرّف فريد للعنصر. |
| `userId` / `householdId` | `uuid NOT NULL` / `uuid NULL` | المالك، ومعرّف البيت المشترك (عند تفعيل المشاركة في المرحلة 3). |
| `title` | `text NOT NULL` (1..160) | اسم الصنف المطلوب شراؤه. |
| `category` | `text NOT NULL DEFAULT 'general'` | تصنيف الصنف (خضار وفاكهة، ألبان، تموين، لحوم، منظفات، أخرى). |
| `storeContext` | `text NOT NULL DEFAULT 'any'` | سياق الشراء للفلترة السريعة على الموبايل (`supermarket`, `greengrocer`, `pharmacy`, `family_visit`, `any`). |
| `quantityNeeded` | `numeric NULL CHECK (> 0)` | الكمية المطلوبة رقميًا (اختيارية عند الإضافة السريعة). |
| `unit` | `text NOT NULL DEFAULT ''` | الوحدة (كجم، عبوة، لتر، علبة...). |
| `quantityText` | `text NOT NULL DEFAULT ''` | يحفظ وصف الكمية النصي الحر أو المرحّل من المهام القديمة (مثل «حزمة» أو «بـ 50 جنيه») دون اختراع رقم. |
| `quantityPurchased` | `numeric NULL CHECK (>= 0)` | الكمية التي تم شراؤها فعليًا. تدعم **الشراء الجزئي** (مطلوب 3، اشترينا 2 $\leftarrow$ المتبقي للشراء = 1). |
| `quantityStocked` | `numeric NOT NULL DEFAULT 0 CHECK (>= 0)` | مجموع الكميات التي دخلت المخزون فعليًا عبر إيصالات الاستلام (`stock_receipts`). |
| `isBought` | `boolean NOT NULL DEFAULT false` | علامة الشراء السريعة (في حال عدم استخدام أرقام دقيقة، أو عند اكتمال شراء المطلوب). |
| `boughtAt` | `timestamptz NULL` | وقت الشراء. |
| `priority` | `'high' \| 'medium' \| 'low'` | الأهمية. |
| `sourceType` | `'manual' \| 'inventory_low' \| 'recipe' \| 'legacy_task'` | مصدر الإضافة. |
| `sourceInventoryItemId` | `text NULL` | يشير إلى **دفعة الخزين (`inventory_items.id`)** التي ولّدت النقص. (تذكير: سجل الخزين يمثل دفعة بمكان وصلاحية، وليس كتالوج صنف عام). |
| `legacyTaskId` | `text NULL UNIQUE per user` | معرّف المهمة القديمة (`life_tasks.id`) عند الترحيل؛ يمنع تكرار الترحيل عند إعادة التشغيل. |
| `notes` | `text NOT NULL DEFAULT ''` | ملاحظات إضافية. |
| `archivedAt` | `timestamptz NULL` | وقت الأرشفة بعد انتهاء الشراء والاستلام. |
| `createdAt` / `updatedAt` | `timestamptz NOT NULL` | طوابع الإنشاء والتحديث. |

### 2. الحالات المشتقة في الواجهة (Derived States — لا تُخزن كـ enum واحد متعارض)
بدل حقل حالة واحد يضيع تفاصيل الشراء الجزئي، تُشتق الحالة من الكميات:
- **مطلوب بالكامل (`needed`):** `!isBought && (quantityPurchased ?? 0) === 0`
- **مشتراة جزئيًا (`partially_bought`):** `quantityNeeded !== null && quantityPurchased !== null && quantityPurchased > 0 && quantityPurchased < quantityNeeded` (يظل الباقي `quantityNeeded - quantityPurchased` ظاهرًا في المطلوب).
- **تم الشراء وبانتظار الإدخال للمخزون (`bought_pending_stock`):** `(isBought || (quantityPurchased ?? 0) > 0) && quantityStocked < (quantityPurchased ?? quantityNeeded ?? 0)`
- **تم الإدخال للمخزون (`stocked`):** `quantityStocked > 0 && quantityStocked >= (quantityPurchased ?? quantityNeeded ?? quantityStocked)`

### 3. عقد إيصال الاستلام ومنع مضاعفة المخزون (`StockReceipt` $\leftrightarrow$ `public.stock_receipts`)
- **المشكلة التي يحلها:** لو المستخدم ضغط «أضف للمخزون» والإنترنت ضعيف، أو ضغط من جهازين، أو ألغى علامة «تم الشراء» بعد ترحيل الكمية للخزين، لا يجوز مضاعفة المخزون أو خصمه عشوائيًا.
- **حقول `stock_receipts`:**
  - `id` (`text PK`), `user_id` (`uuid`), `operation_id` (`text NOT NULL`, فريد لكل مستخدم `UNIQUE(user_id, operation_id)`).
  - `shopping_item_id` (`text NOT NULL`), `inventory_item_id` (`text NOT NULL` — الدفعة التي زادت أو أُنشئت).
  - `quantity_added` (`numeric NOT NULL CHECK (> 0)`), `unit` (`text NOT NULL`), `location` (`text NOT NULL`), `expires_on` (`date NULL`).
  - `created_at` (`timestamptz NOT NULL DEFAULT now()`).
- **قواعد العملية الخادمية (`receive_shopping_item_to_inventory`):**
  1. تنفذ في معاملة واحدة (Single Transaction) مع قفل `pg_advisory_xact_lock`.
  2. إذا كان `operation_id` مسجلًا مسبقًا لنفس المستخدم، تعيد الإيصال السابق فورًا (Idempotent) دون زيادة المخزون مرة ثانية.
  3. إذا اختلف المكان (`location`) أو تاريخ الصلاحية (`expires_on`) عن الدفعة الأصلية، تنشئ دفعة جديدة في `inventory_items` بدل خلط الصلاحيات، وإلا تضيف الكمية للدفعة المستهدفة إذا تطابقت الوحدة وكانت الكمية السابقة معلومة.
  4. تحدّث `shopping_items.quantity_stocked` وتسجل حركة `purchase` في `inventory_items.history`.
  5. إلغاء علامة `isBought` لاحقًا لا يحذف إيصال الاستلام ولا ينقص المخزون تلقائيًا.

### 4. قواعد الترحيل من مهام المشتريات القديمة (`legacy_task`)
1. عرض معاينة للعناصر المرشحة في `life_tasks` (`spaceId === 'home' && isShoppingTask(task)`).
2. استخراج الاسم ونص الكمية عبر `parseShoppingTitle`؛ يوضع نص الكمية في `quantityText` دون اختراع رقم، ويُحفظ `legacyTaskId = task.id`.
3. بعد تأكيد الترحيل، تُعلّم المهمة القديمة أو تُؤرشف بحيث لا تظهر مرتين في الواجهة أو في Today، ويكون الترحيل قابلًا لإعادة التشغيل بأمان بفضل قيد `UNIQUE(user_id, legacy_task_id)`.

---

## الجزء الرابع: مصفوفة ملكية الملفات بالأسماء ومسار الدمج (File Ownership Matrix)

لضمان عدم حدوث تعارضات (Merge Conflicts) أثناء العمل المتوازي، تُقسم الملفات بالاسم كالتالي:

### 1. طبقة العقود والبيانات والمزامنة (Core & Data Layer — مسار منسق واحد ومراجعة إلزامية قبل أي دمج)
> لا يُعدّل أي ملف في هذا الجدول داخل فروع الواجهات بشكل عشوائي؛ يتم تنفيذ التغيير المشترك في خطوة منسقة ومراجعته بين المساعدين أولًا.

| مسار الملف بالاسم | دوره في المرحلة 0 والبطاقة 1 | مسؤول التنفيذ | المراجع (Reviewer) |
|---|---|---|---|
| `src/types/tasks.ts` | إضافة حقول `LifeTask` الجديدة (`availableFrom`, `isSomeday`, `reviewDate`, `taskCategory`, وحقول التأسيس) + `DayPlanSelectedItem` على `DayPlan` | مساعد المسار المشترك (Core) | مساعد الزميل + المطورين |
| `src/types/lifeOs.ts` | إضافة `reviewDate` وحقول التأسيس على `LifeProject` | مساعد المسار المشترك (Core) | مساعد الزميل |
| `src/db/cloudMappers.ts` | تحديث `taskToCloud`, `taskFromCloud` (`client_data_version: 2`), `projectToCloud`, `projectFromCloud`, `dayPlanToCloud`, `dayPlanFromCloud` | مساعد المسار المشترك (Core) | مساعد الزميل |
| `src/db/backup.ts` | تحديث `validateRecord` لقبول والتحقق من الحقول الجديدة و`selectedItems` في `dayPlans` | مساعد المسار المشترك (Core) | مساعد الزميل |
| `src/db/database.ts` | ترقية مخطط Dexie عند الحاجة لفهارس جديدة دون كسر `syncBaselines` | مساعد المسار المشترك (Core) | مساعد الزميل |
| `supabase/migrations/*` | ملف migration لإضافة الأعمدة الاختيارية الجديدة على `life_tasks`, `projects`, `day_plans` مع قيود التحقق | مساعد المسار المشترك (Core) | مساعد الزميل (مراجعة SQL وRLS قبل التطبيق) |

### 2. طبقة خدمات المجال لـ Today والمنزل (Domain Services — البطاقة 1)

| مسار الملف بالاسم | التعديل المطلوب | المالك | المراجع |
|---|---|---|---|
| `src/features/today/todayPlanningService.ts` | دوال `addItemToDayPlan`, `removeItemFromDayPlan`, `reorderDayPlanItems`, `normalizeDayPlan` | مسار (المنزل + Today) | المراجع المعماري |
| `src/features/today/todayAggregator.ts` | إيقاف إدخال المهام غير المؤرخة تلقائيًا، استبعاد `isShoppingTask` و`isSomeday` و`WAITING` ومشاريع `backlog/waiting`، وتجميع `selectedItems` | مسار (المنزل + Today) | المراجع المعماري |
| `src/features/today/todayDecisionEngine.ts` | احترام `selectedItems` (`refKey`) بجانب `essentialTaskIds` واستبعاد غير الجاهز من التوصيات | مسار (المنزل + Today) | المراجع المعماري |
| `src/features/today/todayTypes.ts` | إضافة أنواع الأقسام/الأفعال الخاصة باختيار وإزالة عناصر اليوم | مسار (المنزل + Today) | المراجع المعماري |
| `src/features/today/spaceTaskService.ts` | فصل `revealInToday` (تفعيل إعداد المساحة) عن `selectTaskForToday` (إضافة لـ `DayPlan.selectedItems`) | مسار (المنزل + Today) | المراجع المعماري |
| `src/features/home/homeTasks.ts` | تحديث `isMaintenanceTask` ليقرأ `task.taskCategory === 'maintenance'` أولًا مع fallback للنص القديم | مسار (المنزل + Today) | المراجع المعماري |

### 3. طبقة الواجهات (UI Tracks — عمل متوازٍ بدون تداخل بعد تثبيت طبقة العقود)

#### المسار أ: واجهات إدارة المنزل وToday (Home Management & Today UI)
يمتلك الملفات التالية فقط:
- `src/features/home/tasks/HomeTasksView.tsx` (عرض الفلاتر: جاهز / سريعة / صيانة / لاحقًا للمراجعة + زر «أضف ليومي»، بدون حالة `shopping=true` بعد البطاقة 2).
- `src/features/home/tasks/HomeTaskModal.tsx` (إضافة بالاسم أولًا، مع خيار «لاحقًا / تاريخ مراجعة» وتصنيف الصيانة).
- `src/features/home/projects/HomeProjectsView.tsx` و`src/features/home/projects/HomeProjectModal.tsx` (تمييز `in_progress` عن `backlog/waiting`، تاريخ المراجعة، وزر «أضف الخطوة ليومي»).
- `src/features/home/maintenance/HomeMaintenanceView.tsx` و`src/features/home/maintenance/HomeMaintenanceModal.tsx`.
- `src/features/home/routines/HomeRoutinesView.tsx` و`src/features/home/routines/HomeRoutineModal.tsx`.
- `src/features/today/TodayPage.tsx` وملفات `src/features/today/components/*` (`DayPlanningDialog.tsx`, `TodayItemCard.tsx`, `TodaySectionList.tsx`, + نافذة «اختيار من المساحات»).

#### المسار ب: واجهات وخدمات المطبخ والمشتريات والخزين (Kitchen, Shopping & Inventory Track)
يمتلك الملفات التالية فقط:
- `src/features/home/shopping/*` *(مجلد جديد في البطاقة 2 يشمل `shoppingModel.ts`, `shoppingRepository.ts`, `ShoppingView.tsx`, `ShoppingReceiveModal.tsx`)*.
- `src/features/home/inventory/InventoryLibrary.tsx`, `InventoryTable.tsx`, `InventoryItemUI.tsx`, `InventoryDialog.tsx`, `inventoryRepository.ts` (تطوير الاستهلاك السريع وربط النواقص بخدمة المشتريات الموحدة).
- `src/features/home/recipes/RecipeLibrary.tsx`, `RecipeDialog.tsx`, `recipeModel.ts`, `recipeRepository.ts` (وسم «عايزين نجربها / جربناها» ومقارنة المكونات بالخزين).
- `src/features/home/components/KitchenHeader.tsx`.

#### ملف التنسيق المشترك داخل المنزل:
- `src/features/home/HomeOverview.tsx` و`src/features/home/HomeSpace.tsx`: أي تعديل فيهما يتم بالتنسيق عند ربط ملخص المشتريات أو ملخص أعمال اليوم.

