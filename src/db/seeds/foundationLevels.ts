import { PlanLevel, Routine, PlanWeek, PlanSession, ExercisePrescription } from '../../types';
import { FOUR_WEEK_PLAN } from './fourWeekPlan';

export const FOUNDATION_LEVELS_PLAN: PlanLevel[] = [
  {
    levelNumber: 1,
    title: 'المستوى 1: التأسيس والتثبيت الخالي من الألم',
    subtitle: 'Foundation & Stabilization',
    durationWeeks: 'أول 3 إلى 4 أسابيع',
    goal: 'تفعيل العضلات العميقة واستقرار القوس القطني دون أي إجهاد لأسفل الظهر.',
    rules: [
      'قاعدة الـ 3-4 أسابيع: لا تنتقل للمستوى التالي إلا بعد 3-4 أسابيع كاملة بدون زيادة في الألم أو وخز عصبي.',
      'قاعدة الإتقان قبل الصعوبة: إنهاء كل العدات بتحكم كامل ودون اهتزاز في العمود الفقري.',
      'المبدأ الذهبي: التدرج بزيادة زمن الثبات والتحكم وليس بزيادة السرعة أو إجهاد العضلة حتى الفشل.'
    ],
    sections: [
      {
        title: '1. إحماء وتليين المفاصل',
        category: 'warmup',
        exercises: [
          { exerciseId: 'bk-gentle-cat-camel', arabicName: 'القطة والجمال الخفيف', englishName: 'Gentle Cat-Camel', sets: 2, reps: 6, restSeconds: 30, notes: '6 عدات بطيئة جداً لتحريك المفاصل دون ضغط' }
        ]
      },
      {
        title: '2. تمارين البطن العميقة',
        category: 'core',
        exercises: [
          { exerciseId: 'ab-stomach-vacuum', arabicName: 'تفريغ البطن مستلقياً', englishName: 'Stomach Vacuum', sets: 3, reps: 5, holdSeconds: 10, restSeconds: 45, notes: 'ثبات 10 ثوانٍ' },
          { exerciseId: 'ab-mcgill-curlup', arabicName: 'تمرين ماكجيل للبطن', englishName: 'McGill Curl-Up', sets: 3, reps: 6, holdSeconds: 5, restSeconds: 45, notes: 'يدك تحت ظهرك - ثبات 5 ثوانٍ لكل عدة' }
        ]
      },
      {
        title: '3. تمارين الجوانب ومنع الدوران',
        category: 'core',
        exercises: [
          { exerciseId: 'obl-side-plank-knees', arabicName: 'البلانك الجانبي على الركبتين', englishName: 'Side Plank on Knees', sets: 3, durationSeconds: 15, sides: 'each', restSeconds: 45, notes: 'ثبات 15 ثانية لكل جانب' },
          { exerciseId: 'obl-clamshell', arabicName: 'تمرين المحار', englishName: 'Clamshells', sets: 3, reps: 12, sides: 'each', restSeconds: 45, notes: '12 عدة لكل جانب' }
        ]
      },
      {
        title: '4. تمارين الظهر والسلسلة الخلفية',
        category: 'back',
        exercises: [
          { exerciseId: 'bk-glute-bridge', arabicName: 'الجسر العادي', englishName: 'Glute Bridge', sets: 3, reps: 10, holdSeconds: 1, restSeconds: 45, notes: 'ثبات ثانية في الأعلى دون مبالغة في الرفع' },
          { exerciseId: 'bk-bird-dog', arabicName: 'الطائر والكلب (بحركة الرجلين فقط)', englishName: 'Bird Dog (Legs only)', sets: 3, reps: 8, sides: 'each', restSeconds: 45, notes: 'اليدين ثابتتان لتسهيل التوازن' }
        ]
      }
    ]
  },
  {
    levelNumber: 2,
    title: 'المستوى 2: بناء التحمل العضلي وقوة الجذع',
    subtitle: 'Endurance & Core Control',
    durationWeeks: 'من الأسبوع 4 إلى 8',
    goal: 'رفع كفاءة التحمل لمنع إجهاد الظهر أثناء الجلوس في العمل (من 8 صباحاً إلى 4 عصراً).',
    rules: [
      'التأكد من خلو الحركات من أي ألم حاد أو شعور كهربائي في الساقين.',
      'التنفس المنتظم والزفير المستمر أثناء الجهد وتجنب حبس النفس تماماً.',
      'استخدام وزن خفيف (3-5 كجم) فقط في حمل الحقيبة للحفاظ على استقامة العمود الفقري.'
    ],
    sections: [
      {
        title: '1. إحماء',
        category: 'warmup',
        exercises: [
          { exerciseId: 'bk-gentle-cat-camel', arabicName: 'القطة والجمال الخفيف', englishName: 'Gentle Cat-Camel', sets: 2, reps: 6, restSeconds: 30, notes: 'مجموعتان × 6 عدات' }
        ]
      },
      {
        title: '2. تمارين البطن',
        category: 'core',
        exercises: [
          { exerciseId: 'ab-dead-bug', arabicName: 'الحشرة الميتة', englishName: 'Dead Bug', sets: 3, reps: 8, sides: 'each', restSeconds: 45, notes: 'الذراع العكسية مع الساق' },
          { exerciseId: 'ab-elevated-plank', arabicName: 'البلانك المرتفع على حافة', englishName: 'Elevated Plank', sets: 3, durationSeconds: 28, restSeconds: 45, notes: 'ثبات 25–30 ثانية' }
        ]
      },
      {
        title: '3. تمارين الجوانب',
        category: 'core',
        exercises: [
          { exerciseId: 'obl-wall-side-plank', arabicName: 'البلانك الجانبي على الساعد والقدمين', englishName: 'Side Plank', sets: 3, durationSeconds: 22, sides: 'each', restSeconds: 45, notes: 'ثبات 20–25 ثانية لكل جانب' },
          { exerciseId: 'obl-suitcase-carry', arabicName: 'حمل الحقيبة بوزن في يد واحدة', englishName: 'Suitcase Carry', sets: 3, durationSeconds: 30, sides: 'each', restSeconds: 45, notes: 'مشي 30 ثانية لكل يد بوزن 3-5 كجم مع استقامة تامة' }
        ]
      },
      {
        title: '4. تمارين الظهر',
        category: 'back',
        exercises: [
          { exerciseId: 'bk-bird-dog', arabicName: 'الطائر والكلب الكامل', englishName: 'Bird Dog', sets: 3, reps: 8, holdSeconds: 2, sides: 'each', restSeconds: 45, notes: 'ذراع وساق متعاكسان مع ثبات ثانيتين' },
          { exerciseId: 'bk-glute-bridge-squeeze', arabicName: 'الجسر مع ضم وسادة', englishName: 'Glute Bridge with Squeeze', sets: 3, reps: 11, restSeconds: 45, notes: '10–12 عدة' },
          { exerciseId: 'bk-seated-band-row', arabicName: 'سحب الحزام جالساً', englishName: 'Seated Resistance Band Row', sets: 3, reps: 11, restSeconds: 45, notes: 'تقوية عضلات أعلى الظهر والوضعية' }
        ]
      }
    ]
  },
  {
    levelNumber: 3,
    title: 'المستوى 3: القوة الوظيفية ومنع الانتكاسات',
    subtitle: 'Functional Strength & Resilience',
    durationWeeks: 'بعد إتمام الأسبوع 8 بنجاح',
    goal: 'تدريب الظهر على مقاومة الحركات المفاجئة وحمل الأوزان اليومية بأمان واستقرار كامل.',
    rules: [
      'مستوى متقدم يتطلب إتقان التثبيت التام وعدم التسرع.',
      'في حال الشعور بأي تعب بالظهر أثناء الدب الثابت، انزل الركبتين فوراً واسترح.',
      'الحفاظ على الاستقامة التامة أثناء حمل الحقيبة ومنع ميل الجذع لأي اتجاه.'
    ],
    sections: [
      {
        title: '1. إحماء وتليين متقدم',
        category: 'warmup',
        exercises: [
          { exerciseId: 'bk-gentle-cat-camel', arabicName: 'القطة والجمال الخفيف', englishName: 'Gentle Cat-Camel', sets: 2, reps: 6, restSeconds: 30, notes: 'تليين مفاصل الفقرات' },
          { exerciseId: 'bk-standing-lumbar-extension', arabicName: 'مد الظهر أثناء الوقوف', englishName: 'Standing Lumbar Extension', sets: 1, reps: 5, restSeconds: 30, notes: '5 عدات برفق لاستعادة التقوس' }
        ]
      },
      {
        title: '2. تمارين البطن الوظيفية',
        category: 'core',
        exercises: [
          { exerciseId: 'ab-bear-crawl-hold', arabicName: 'الدب الثابت', englishName: 'Bear Crawl Hold', sets: 3, durationSeconds: 25, restSeconds: 45, notes: 'ثبات 20–30 ثانية والركبتين مرتفعتين 2 سم' },
          { exerciseId: 'ab-banded-dead-bug', arabicName: 'الحشرة الميتة مع حزام مقاومة', englishName: 'Banded Dead Bug', sets: 3, reps: 8, sides: 'each', restSeconds: 45, notes: '8 عدات لكل جانب' }
        ]
      },
      {
        title: '3. تمارين الجوانب والقوة الدائرية',
        category: 'core',
        exercises: [
          { exerciseId: 'obl-pallof-press', arabicName: 'البالوف بريس بحزام المقاومة', englishName: 'Pallof Press', sets: 3, reps: 10, sides: 'each', restSeconds: 45, notes: '10 عدات لكل جانب مع ثبات ثانيتين للأمام' },
          { exerciseId: 'obl-suitcase-carry', arabicName: 'حمل الحقيبة بوزن في يد واحدة', englishName: 'Suitcase Carry', sets: 3, durationSeconds: 45, sides: 'each', restSeconds: 45, notes: 'مشي 45 ثانية بوزن متوسط وتحكم كامل' }
        ]
      },
      {
        title: '4. تمارين الظهر والسلسلة الخلفية',
        category: 'back',
        exercises: [
          { exerciseId: 'bk-prone-arm-leg-lift', arabicName: 'سوبرمان المعدل بالتناوب', englishName: 'Modified Superman', sets: 3, reps: 10, sides: 'each', restSeconds: 45, notes: 'مع وسادة تحت الحوض - 10 عدات لكل جانب' },
          { exerciseId: 'obl-kickstand-bridge', arabicName: 'الجسر برجل واحدة مدعومة', englishName: 'Kickstand Glute Bridge', sets: 3, reps: 8, sides: 'each', restSeconds: 45, notes: '8 عدات لكل جهة' },
          { exerciseId: 'bk-prone-cobra', arabicName: 'تمرين الكوبرا الخفيف', englishName: 'Prone Cobra', sets: 3, reps: 8, holdSeconds: 5, restSeconds: 45, notes: 'ثبات 5 ثوانٍ مع عصر لوحي الكتف' }
        ]
      }
    ]
  }
];

// إنشاء كافة روتينات جلسات الخطة الـ 16 لتشغيلها مباشرة في الـ WorkoutPlayer
export const ALL_PLAN_ROUTINES: Routine[] = FOUR_WEEK_PLAN.flatMap((week: PlanWeek) =>
  week.sessions.map((s: PlanSession) => ({
    id: s.routineId,
    name: `${week.title.split(':')[0]} • ${s.title}`,
    description: s.description,
    exerciseIds: s.prescriptions.map((p: ExercisePrescription) => p.exerciseId),
    totalEstimatedMinutes: s.estimatedMinutes,
    level: week.weekNumber === 1 ? 'gentle' : week.weekNumber <= 3 ? 'moderate' : 'deep',
    tag: `خطة 4 أسابيع / ${week.title.split(':')[0]}`,
    weekNumber: week.weekNumber,
    sessionCode: s.sessionCode,
    planSessionId: s.id,
    prescriptions: s.prescriptions
  }))
);

