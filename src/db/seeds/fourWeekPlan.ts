import { PlanWeek } from '../../types';

export const FOUR_WEEK_PLAN: PlanWeek[] = [
  {
    weekNumber: 1,
    title: 'الأسبوع الأول: تأسيس التثبيت وتحفيز الأعصاب العميقة',
    description: 'التركيز على تنشيط عضلات البطن العميقة واستقرار القوس القطني دون أي إجهاد لأسفل الظهر.',
    focus: 'تأسيس التثبيت وتحفيز عضلات الكورسيه العميق',
    sessions: [
      {
        id: 'plan-w1-sA',
        sessionCode: 'A',
        title: 'الجلسة A: تفعيل الكورسيه والبلانك الركبي',
        description: 'ماكجيل للبطن + بلانك جانبي على الركبتين + القطة والجمال + الجسر',
        estimatedMinutes: 20,
        dayOfWeek: 6, // السبت
        dayNameAr: 'السبت',
        routineId: 'routine-w1-sA',
        prescriptions: [
          { exerciseId: 'ab-mcgill-curlup', sets: 3, reps: 6, holdSeconds: 5, restSeconds: 45, notes: 'يدك تحت ظهرك لدعم القوس القطني' },
          { exerciseId: 'obl-side-plank-knees', sets: 3, durationSeconds: 15, sides: 'each', restSeconds: 45, notes: 'ثبات 15 ثانية لكل جانب' },
          { exerciseId: 'bk-gentle-cat-camel', sets: 2, reps: 6, restSeconds: 30, notes: 'حركة سلسة وبطيئة دون ضغط' },
          { exerciseId: 'bk-glute-bridge', sets: 3, reps: 10, holdSeconds: 1, restSeconds: 45, notes: 'عصر خفيف لعضلات الألوية' }
        ]
      },
      {
        id: 'plan-w1-sB',
        sessionCode: 'B',
        title: 'الجلسة B: التنسيق العصبي وثبات الحوض',
        description: 'الحشرة الميتة + تمرين المحار + الطائر والكلب + مد الظهر وقوفاً',
        estimatedMinutes: 20,
        dayOfWeek: 1, // الإثنين
        dayNameAr: 'الاثنين',
        routineId: 'routine-w1-sB',
        prescriptions: [
          { exerciseId: 'ab-dead-bug', sets: 3, reps: 8, sides: 'each', restSeconds: 45, notes: 'التصاق أسفل الظهر بالأرض' },
          { exerciseId: 'obl-clamshell', sets: 3, reps: 12, sides: 'each', restSeconds: 45, notes: 'تثبيت الحوض وتنشيط الألوية الوسطى' },
          { exerciseId: 'bk-bird-dog', sets: 3, reps: 8, holdSeconds: 2, sides: 'each', restSeconds: 45, notes: 'ذراع وساق متعاكسان مع ثبات ثانيتين' },
          { exerciseId: 'bk-standing-lumbar-extension', sets: 2, reps: 6, restSeconds: 30, notes: 'تفريغ فوري لضغط الغضاريف' }
        ]
      },
      {
        id: 'plan-w1-sC',
        sessionCode: 'C',
        title: 'الجلسة C: تفريغ البطن وانزلاق الكتفين',
        description: 'تفريغ البطن مستلقياً + بلانك الحائط الجانبي + سوبرمان المعدل + انزلاق الحائط',
        estimatedMinutes: 22,
        dayOfWeek: 3, // الأربعاء
        dayNameAr: 'الأربعاء',
        routineId: 'routine-w1-sC',
        prescriptions: [
          { exerciseId: 'ab-stomach-vacuum', sets: 3, reps: 5, holdSeconds: 10, restSeconds: 45, notes: 'زفير كامل وشفط السرة نحو العمود الفقري' },
          { exerciseId: 'obl-wall-side-plank', sets: 3, durationSeconds: 20, sides: 'each', restSeconds: 45, notes: 'ثبات 20 ثانية لكل جانب بالحائط' },
          { exerciseId: 'bk-prone-arm-leg-lift', sets: 3, reps: 8, sides: 'each', restSeconds: 45, notes: 'مع وسادة تحت الحوض لحماية الظهر' },
          { exerciseId: 'bk-wall-angels', sets: 3, reps: 8, restSeconds: 30, notes: 'تحسين قوام أعلى الظهر ولوحي الكتف' }
        ]
      },
      {
        id: 'plan-w1-sD',
        sessionCode: 'D',
        title: 'الجلسة D: التثبيت متساوي القياس والكوبرا',
        description: 'دفع الركبتين متساوي القياس + رفع الساق الجانبي + الكوبرا + سحب الحزام',
        estimatedMinutes: 22,
        dayOfWeek: 4, // الخميس
        dayNameAr: 'الخميس',
        routineId: 'routine-w1-sD',
        prescriptions: [
          { exerciseId: 'ab-isometric-knee-press', sets: 3, reps: 6, holdSeconds: 6, restSeconds: 45, notes: 'دفع متبادل 6 ثوانٍ مع تنفس سلس' },
          { exerciseId: 'obl-side-lying-leg-lift', sets: 3, reps: 10, sides: 'each', restSeconds: 45, notes: 'رفع مضبوط دون لف الحوض' },
          { exerciseId: 'bk-prone-cobra', sets: 3, reps: 6, holdSeconds: 3, restSeconds: 45, notes: 'عصر لوحي الكتف للخلف' },
          { exerciseId: 'bk-seated-band-row', sets: 3, reps: 10, restSeconds: 45, notes: 'سحب هادئ مع استقامة الجذع' }
        ]
      }
    ]
  },
  {
    weekNumber: 2,
    title: 'الأسبوع الثاني: تعزيز التحمل وإدخال تمارين المقاومة الثابتة',
    description: 'رفع كفاءة التحمل العضلي لمنع إجهاد الظهر أثناء الجلوس في العمل (8ص - 4ع).',
    focus: 'بناء التحمل العضلي ومقاومة قوى الانحناء والدوران',
    sessions: [
      {
        id: 'plan-w2-sA',
        sessionCode: 'A',
        title: 'الجلسة A: نقر الكعبين وحمل الحقيبة',
        description: 'نقر الكعبين + حمل الحقيبة بيد واحدة + الجسر مع وسادة + الطائر والكلب',
        estimatedMinutes: 22,
        dayOfWeek: 6,
        dayNameAr: 'السبت',
        routineId: 'routine-w2-sA',
        prescriptions: [
          { exerciseId: 'ab-heel-taps', sets: 3, reps: 10, sides: 'each', restSeconds: 45, notes: 'ملامسة خفيفة للأرض مع بقاء الظهر لاصقاً' },
          { exerciseId: 'obl-suitcase-carry', sets: 3, durationSeconds: 30, sides: 'each', restSeconds: 45, notes: 'مشي بوزن 3-5 كجم مع استقامة تامة لمنع الميلان' },
          { exerciseId: 'bk-glute-bridge-squeeze', sets: 3, reps: 10, restSeconds: 45, notes: 'ضم الوسادة لتفعيل العضلات المقربة وتثبيت الحوض' },
          { exerciseId: 'bk-bird-dog', sets: 3, reps: 8, holdSeconds: 2, sides: 'each', restSeconds: 45, notes: 'ثبات ثانيتين في القمة' }
        ]
      },
      {
        id: 'plan-w2-sB',
        sessionCode: 'B',
        title: 'الجلسة B: البلانك المرتفع والبالوف بريس',
        description: 'البلانك المرتفع + بالوف بريس بالحزام + سوبرمان المعدل + سحب الحزام',
        estimatedMinutes: 24,
        dayOfWeek: 1,
        dayNameAr: 'الاثنين',
        routineId: 'routine-w2-sB',
        prescriptions: [
          { exerciseId: 'ab-elevated-plank', sets: 3, durationSeconds: 25, restSeconds: 45, notes: 'على حافة أريكة/طاولة ثبات 25 ثانية' },
          { exerciseId: 'obl-pallof-press', sets: 3, reps: 8, sides: 'each', restSeconds: 45, notes: 'مقاومة دوران الجذع مع ثبات ثانيتين للأمام' },
          { exerciseId: 'bk-prone-arm-leg-lift', sets: 3, reps: 10, sides: 'each', restSeconds: 45, notes: 'مع وسادة تحت الحوض' },
          { exerciseId: 'bk-seated-band-row', sets: 3, reps: 12, restSeconds: 45, notes: 'تقوية عضلات أعلى الظهر والوضعية' }
        ]
      },
      {
        id: 'plan-w2-sC',
        sessionCode: 'C',
        title: 'الجلسة C: ضغط الحائط والحريق الهيدروليكي',
        description: 'الضغط على الحائط + تمرين Fire Hydrant + تمرين W إلى Y + الجسر',
        estimatedMinutes: 22,
        dayOfWeek: 3,
        dayNameAr: 'الأربعاء',
        routineId: 'routine-w2-sC',
        prescriptions: [
          { exerciseId: 'ab-wall-press-core', sets: 3, durationSeconds: 15, restSeconds: 45, notes: 'دفع اليدين في الحائط لتفعيل عضلات البطن العميقة' },
          { exerciseId: 'obl-fire-hydrant', sets: 3, reps: 10, sides: 'each', restSeconds: 45, notes: 'رفع الساق دون لف الحوض' },
          { exerciseId: 'bk-prone-w-to-y', sets: 3, reps: 8, restSeconds: 45, notes: 'تثبيت اللوحين واستقامة الفقرات الصدرية' },
          { exerciseId: 'bk-glute-bridge', sets: 3, reps: 12, restSeconds: 45, notes: 'صعود مضبوط' }
        ]
      },
      {
        id: 'plan-w2-sD',
        sessionCode: 'D',
        title: 'الجلسة D: تراجع الجذع والجسر الأحادي',
        description: 'تراجع الجذع جالساً + الحشرة المتعارضة + الجسر برجل واحدة مدعومة + القطة والجمال',
        estimatedMinutes: 22,
        dayOfWeek: 4,
        dayNameAr: 'الخميس',
        routineId: 'routine-w2-sD',
        prescriptions: [
          { exerciseId: 'ab-seated-lean-back', sets: 3, reps: 8, holdSeconds: 2, restSeconds: 45, notes: 'ميلان خفيف للخلف مع الحفاظ على استقامة الظهر' },
          { exerciseId: 'obl-contralateral-deadbug', sets: 3, reps: 6, sides: 'each', restSeconds: 45, notes: 'ضغط اليد العكسية على الركبة لثبات قوي' },
          { exerciseId: 'obl-kickstand-bridge', sets: 3, reps: 8, sides: 'each', restSeconds: 45, notes: 'دعم خفيف بكعب الساق الأخرى' },
          { exerciseId: 'bk-gentle-cat-camel', sets: 2, reps: 6, restSeconds: 30, notes: 'استشفاء وتليين ختامي' }
        ]
      }
    ]
  },
  {
    weekNumber: 3,
    title: 'الأسبوع الثالث: بناء الثبات الديناميكي ودمج تمارين المقاومة',
    description: 'تطوير القوة التثبيتية الديناميكية وإتقان حركات الحزام المطاطي والدب الثابت.',
    focus: 'ثبات ديناميكي متقدم ودمج الأطراف الأربعة',
    sessions: [
      {
        id: 'plan-w3-sA',
        sessionCode: 'A',
        title: 'الجلسة A: الحشرة بالحزام وثبات الدوران',
        description: 'الحشرة الميتة بالحزام + ثبات الدوران نصف راكع + الكوبرا + الجسر مع وسادة',
        estimatedMinutes: 24,
        dayOfWeek: 6,
        dayNameAr: 'السبت',
        routineId: 'routine-w3-sA',
        prescriptions: [
          { exerciseId: 'ab-banded-dead-bug', sets: 3, reps: 8, sides: 'each', restSeconds: 45, notes: 'مقاومة مطاطية تزيد تفريغ الحمل عن الفقرات' },
          { exerciseId: 'obl-half-kneeling-chop', sets: 3, durationSeconds: 15, sides: 'each', restSeconds: 45, notes: 'ثبات 15 ثانية ضد قوى الالتفاف' },
          { exerciseId: 'bk-prone-cobra', sets: 3, reps: 8, holdSeconds: 4, restSeconds: 45, notes: 'ثبات 4 ثوانٍ مع عصر لوحي الكتف' },
          { exerciseId: 'bk-glute-bridge-squeeze', sets: 3, reps: 12, restSeconds: 45, notes: 'تثبيت الحوض وتنشيط الألوية' }
        ]
      },
      {
        id: 'plan-w3-sB',
        sessionCode: 'B',
        title: 'الجلسة B: الدب الثابت وتحدي الطائر والكلب',
        description: 'الدب الثابت + بلانك الركبتين الجانبي + الطائر والكلب (10 عدات) + انزلاق الحائط',
        estimatedMinutes: 24,
        dayOfWeek: 1,
        dayNameAr: 'الاثنين',
        routineId: 'routine-w3-sB',
        prescriptions: [
          { exerciseId: 'ab-bear-crawl-hold', sets: 3, durationSeconds: 18, restSeconds: 45, notes: 'ركبتيك مرتفعتين 2 سم فقط عن الأرض مع ثبات الظهر' },
          { exerciseId: 'obl-side-plank-knees', sets: 3, durationSeconds: 22, sides: 'each', restSeconds: 45, notes: 'زيادة مدة الثبات إلى 22 ثانية' },
          { exerciseId: 'bk-bird-dog', sets: 3, reps: 10, holdSeconds: 2, sides: 'each', restSeconds: 45, notes: 'تحكم كامل وبطء في الحركة' },
          { exerciseId: 'bk-wall-angels', sets: 3, reps: 10, restSeconds: 30, notes: '10 عدات انزلاق كامل على الحائط' }
        ]
      },
      {
        id: 'plan-w3-sC',
        sessionCode: 'C',
        title: 'الجلسة C: ماكجيل المتقدم والجسر الأحادي',
        description: 'ماكجيل للبطن (8 عدات) + المحار (15 عدة) + الجسر برجل واحدة مدعومة + سحب الحزام',
        estimatedMinutes: 24,
        dayOfWeek: 3,
        dayNameAr: 'الأربعاء',
        routineId: 'routine-w3-sC',
        prescriptions: [
          { exerciseId: 'ab-mcgill-curlup', sets: 3, reps: 8, holdSeconds: 5, restSeconds: 45, notes: 'ثبات 5 ثوانٍ لكل عدة' },
          { exerciseId: 'obl-clamshell', sets: 3, reps: 15, sides: 'each', restSeconds: 45, notes: '15 عدة لكل جانب لتحمل الألوية الوسطى' },
          { exerciseId: 'obl-kickstand-bridge', sets: 3, reps: 10, sides: 'each', restSeconds: 45, notes: '10 عدات لكل جهة' },
          { exerciseId: 'bk-seated-band-row', sets: 3, reps: 12, restSeconds: 45, notes: 'سحب الحزام مع عصر ثانية في الخلف' }
        ]
      },
      {
        id: 'plan-w3-sD',
        sessionCode: 'D',
        title: 'الجلسة D: الحشرة الميتة وحمل الحقيبة المطور',
        description: 'الحشرة الميتة (10 عدات) + حمل الحقيبة 35 ثانية + تمرين W إلى Y + مد الظهر وقوفاً',
        estimatedMinutes: 22,
        dayOfWeek: 4,
        dayNameAr: 'الخميس',
        routineId: 'routine-w3-sD',
        prescriptions: [
          { exerciseId: 'ab-dead-bug', sets: 3, reps: 10, sides: 'each', restSeconds: 45, notes: '10 عدات متقنة لكل جانب' },
          { exerciseId: 'obl-suitcase-carry', sets: 3, durationSeconds: 35, sides: 'each', restSeconds: 45, notes: 'مشي 35 ثانية لكل يد مع منع أي ميلان' },
          { exerciseId: 'bk-prone-w-to-y', sets: 3, reps: 8, restSeconds: 45, notes: 'تثبيت اللوحين' },
          { exerciseId: 'bk-standing-lumbar-extension', sets: 3, reps: 6, restSeconds: 30, notes: '3 مجموعات خفيفة لتليين الفقرات' }
        ]
      }
    ]
  },
  {
    weekNumber: 4,
    title: 'الأسبوع الرابع: تعزيز القوة الوظيفية والتكامل العضلي',
    description: 'المرحلة الختامية لتدريب الظهر على مقاومة الحركات المفاجئة وحمل الأوزان اليومية بأمان تام.',
    focus: 'تكامل الحزام العضلي ومنع الانتكاسات الحركية',
    sessions: [
      {
        id: 'plan-w4-sA',
        sessionCode: 'A',
        title: 'الجلسة A: ثبات الدب والبالوف بريس المتقدم',
        description: 'الدب الثابت (25 ثانية) + بالوف بريس (10 عدات) + سوبرمان المعدل + الجسر مع وسادة',
        estimatedMinutes: 25,
        dayOfWeek: 6,
        dayNameAr: 'السبت',
        routineId: 'routine-w4-sA',
        prescriptions: [
          { exerciseId: 'ab-bear-crawl-hold', sets: 3, durationSeconds: 25, restSeconds: 45, notes: 'ثبات 25 ثانية مع تنفس بطيء' },
          { exerciseId: 'obl-pallof-press', sets: 3, reps: 10, sides: 'each', restSeconds: 45, notes: '10 عدات لكل جانب مع ثبات ثانيتين للأمام' },
          { exerciseId: 'bk-prone-arm-leg-lift', sets: 3, reps: 10, sides: 'each', restSeconds: 45, notes: 'مع وسادة تحت الحوض' },
          { exerciseId: 'bk-glute-bridge-squeeze', sets: 3, reps: 12, restSeconds: 45, notes: 'تحكم وثبات في القمة' }
        ]
      },
      {
        id: 'plan-w4-sB',
        sessionCode: 'B',
        title: 'الجلسة B: الحشرة المقاومة وثبات الطائر الكامل',
        description: 'الحشرة بحزام المقاومة + ثبات الدوران نصف راكع + الطائر والكلب (ثبات 3 ثوانٍ) + الكوبرا',
        estimatedMinutes: 25,
        dayOfWeek: 1,
        dayNameAr: 'الاثنين',
        routineId: 'routine-w4-sB',
        prescriptions: [
          { exerciseId: 'ab-banded-dead-bug', sets: 3, reps: 8, sides: 'each', restSeconds: 45, notes: 'ثبات البطن مع مقاومة الحبل' },
          { exerciseId: 'obl-half-kneeling-chop', sets: 3, durationSeconds: 20, sides: 'each', restSeconds: 45, notes: 'ثبات 20 ثانية لكل جانب' },
          { exerciseId: 'bk-bird-dog', sets: 3, reps: 10, holdSeconds: 3, sides: 'each', restSeconds: 45, notes: 'ثبات 3 ثوانٍ كاملة في القمة' },
          { exerciseId: 'bk-prone-cobra', sets: 3, reps: 8, holdSeconds: 5, restSeconds: 45, notes: 'ثبات 5 ثوانٍ مع عصر لوحي الكتف' }
        ]
      },
      {
        id: 'plan-w4-sC',
        sessionCode: 'C',
        title: 'الجلسة C: البلانك المرتفع والحشرة المتعارضة',
        description: 'البلانك المرتفع (30 ثانية) + الحشرة المتعارضة (6 ثوانٍ) + الجسر الأحادي + سحب الحزام',
        estimatedMinutes: 25,
        dayOfWeek: 3,
        dayNameAr: 'الأربعاء',
        routineId: 'routine-w4-sC',
        prescriptions: [
          { exerciseId: 'ab-elevated-plank', sets: 3, durationSeconds: 30, restSeconds: 45, notes: 'ثبات 30 ثانية بجسم مستقيم كالمسطرة' },
          { exerciseId: 'obl-contralateral-deadbug', sets: 3, reps: 6, holdSeconds: 6, sides: 'each', restSeconds: 45, notes: 'دفع 6 ثوانٍ متواصلة لكل عدة' },
          { exerciseId: 'obl-kickstand-bridge', sets: 3, reps: 10, sides: 'each', restSeconds: 45, notes: 'عصر الألوية' },
          { exerciseId: 'bk-seated-band-row', sets: 3, reps: 12, restSeconds: 45, notes: 'عصر الظهر ثانية في كل عدة' }
        ]
      },
      {
        id: 'plan-w4-sD',
        sessionCode: 'D',
        title: 'الجلسة D: مسك الختام والاستشفاء المتكامل',
        description: 'ضغط الحائط (20 ثانية) + حمل الحقيبة (40 ثانية) + تمرين W إلى Y + القطة والجمال',
        estimatedMinutes: 24,
        dayOfWeek: 4,
        dayNameAr: 'الخميس',
        routineId: 'routine-w4-sD',
        prescriptions: [
          { exerciseId: 'ab-wall-press-core', sets: 3, durationSeconds: 20, restSeconds: 45, notes: 'تفعيل كامل للحزام العضلي' },
          { exerciseId: 'obl-suitcase-carry', sets: 3, durationSeconds: 40, sides: 'each', restSeconds: 45, notes: 'مشي 40 ثانية لكل يد بتحكم كامل' },
          { exerciseId: 'bk-prone-w-to-y', sets: 3, reps: 10, restSeconds: 45, notes: '10 عدات متقنة' },
          { exerciseId: 'bk-gentle-cat-camel', sets: 2, reps: 8, restSeconds: 30, notes: 'تليين واستشفاء ختامي للعمود الفقري' }
        ]
      }
    ]
  }
];

