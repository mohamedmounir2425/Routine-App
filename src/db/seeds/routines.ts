import { Routine } from '../../types';

export const INITIAL_ROUTINES: Routine[] = [
  {
    id: 'routine-core-back-shield',
    name: 'درع الظهر وتثبيت الجذع (Core & Spine Shield)',
    description: 'روتين متكامل يجمع ثلاثية ماكجيل والتمارين الآمنة للبطن وأسفل الظهر لبناء درع حامٍ حول العمود الفقري.',
    exerciseIds: [
      'bk-gentle-cat-camel',
      'ab-mcgill-curlup',
      'bk-bird-dog',
      'obl-side-plank-knees',
      'bk-glute-bridge',
      'ab-dead-bug'
    ],
    totalEstimatedMinutes: 12,
    level: 'gentle',
    tag: 'درع الظهر / حماية',
    isDefault: true,
  },
  {
    id: 'routine-pelvic-lateral-stability',
    name: 'روتين ثبات الحوض والجوانب (Pelvic Stability)',
    description: 'يقوي العضلات الجانبية والألوية الوسطى لمنع ميلان الحوض وتخفيف التوتر العصبي عن أسفل الظهر.',
    exerciseIds: [
      'bk-gentle-cat-camel',
      'obl-clamshell',
      'obl-side-lying-leg-lift',
      'ab-stomach-vacuum',
      'obl-kickstand-bridge',
      'bk-standing-lumbar-extension'
    ],
    totalEstimatedMinutes: 12,
    level: 'moderate',
    tag: 'ثبات الحوض / جوانب',
    isDefault: false,
  },
  {
    id: 'routine-posture-thoracic-relief',
    name: 'روتين تصحيح القوام وأعلى الظهر (Upper Back & Posture)',
    description: 'مصمم خصيصاً لمن يجلسون فترات طويلة أمام الشاشات لفك تحدب أعلى الظهر وتنشيط لوح الكتف.',
    exerciseIds: [
      'bk-standing-lumbar-extension',
      'bk-prone-cobra',
      'bk-wall-angels',
      'bk-prone-w-to-y',
      'ab-seated-lean-back',
      'bk-glute-bridge-squeeze'
    ],
    totalEstimatedMinutes: 11,
    level: 'gentle',
    tag: 'قوام سليم / مكتبي',
    isDefault: false,
  },
  {
    id: 'routine-mini-rescue',
    name: 'جلسة الإنقاذ السريعة لآلام الظهر (5 دقائق)',
    description: '3 تمارين خفيفة ولطيفة جداً لتليين الظهر وتخفيف الضغط عندما تشعر بالإرهاق وللحفاظ على الـ Streak.',
    exerciseIds: [
      'bk-standing-lumbar-extension',
      'bk-gentle-cat-camel',
      'bk-glute-bridge'
    ],
    totalEstimatedMinutes: 5,
    level: 'gentle',
    tag: 'إنقاذ سريع',
    isMiniRescue: true,
  }
];

