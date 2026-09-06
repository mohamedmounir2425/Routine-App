import { Exercise, Routine, UserSettings, WeeklyScheduleItem, PlanWeek, PlanLevel, PlanSession, ExercisePrescription } from '../types';

export interface BackSafetyTip {
  id: number;
  title: string;
  description: string;
}

export const BACK_SAFETY_TIPS: BackSafetyTip[] = [
  {
    id: 1,
    title: 'توقف فوراً عند الشعور بألم حاد',
    description: 'توقف فوراً عند الشعور بألم حاد أو إشعاع عصبي (تنميل، خدر، كهرباء) يمتد للساقين.'
  },
  {
    id: 2,
    title: 'تجنب التمرن أول 60 دقيقة بعد الاستيقاظ',
    description: 'انتظر ساعة بعد الاستيقاظ لتقليل الضغط الداخلي المائي المرتفع على الغضاريف صباحاً.'
  },
  {
    id: 3,
    title: 'التزم بالزفير وتجنب حبس النفس',
    description: 'التزم بالزفير المنتظم وتجنب حبس النفس تماماً لتقليل الضغط داخل البطن والعمود الفقري.'
  },
  {
    id: 4,
    title: 'ممنوع ثني الظهر مع اللف معاً',
    description: 'تجنب تماماً الجمع بين ثني الظهر والالتفاف في نفس الوقت (Flexion + Rotation).'
  },
  {
    id: 5,
    title: 'تمرن على بساط سميك (Mat)',
    description: 'تمرن دائماً على بساط سميك مخصص وتجنب الأسطح الصلبة جداً أو السرير شديد النعومة.'
  },
  {
    id: 6,
    title: 'لا تنفذ كل التمارين في جلسة واحدة',
    description: 'اختر تمرينين أو ثلاثة فقط من كل قسم للجلسة الواحدة بدلاً من إجهاد العضلات بالكامل.'
  },
  {
    id: 7,
    title: 'التركيز على الثبات والتحكم البطيء',
    description: 'ركز على التحكم البطيء والثبات، ولا تجعل الأولوية للسرعة أو العدات الكثيرة.'
  }
];

export const INITIAL_EXERCISES: Exercise[] = [
  // ==========================================
  // 1. تمارين البطن (Abdominals) - 10 تمارين
  // ==========================================
  {
    id: 'ab-mcgill-curlup',
    name: 'McGill Curl-Up',
    arabicName: 'تمرين ماكجيل للبطن (McGill Curl-Up)',
    category: 'core',
    durationSeconds: 50,
    reps: 8,
    restAfterSeconds: 15,
    description: 'تمرين بروفيسور ستيوارت ماكجيل الذهبي لتقوية عضلات البطن العميقة بدون أي ضغط أو انحناء على فقرات الظهر القطنية.',
    instructions: [
      'استلقِ على ظهرك وضع يديك أسفل القوس القطني لدعمه والحفاظ على تقوسه الطبيعي.',
      'اثنِ ساقاً واحدة بزاوية 90 درجة وافرد الساق الأخرى مستقيمة على الأرض.',
      'ارفع رأسك وأعلى كتفيك قليلاً مسافة سنتيمترات عن الأرض دون ثني الرقبة.',
      'اثبت لمدة 5 ثوانٍ مع التنفس، ثم انزل ببطء. (3 مجموعات × 6–8 عدات).'
    ],
    precautions: [
      'لا تدع عنقك ينثني للأمام أو يشد؛ انظر للسقف واجعل الحركة نابعة من الصدر فقط.'
    ],
    targetMuscles: ['عضلات البطن العميقة', 'استقرار القوس القطني', 'حماية الديسك'],
    videoUrl: 'https://www.youtube.com/embed/3-iICBy13ts?enablejsapi=1',
    youtubeUrl: 'https://youtu.be/3-iICBy13ts',
    isFavorite: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ab-dead-bug',
    name: 'Dead Bug',
    arabicName: 'الحشرة الميتة (Dead Bug)',
    category: 'core',
    durationSeconds: 60,
    reps: 8,
    restAfterSeconds: 15,
    description: 'أضمن تمرين لتقوية عضلات البطن الداخلية لمن يعانون من آلام الظهر دون أي تحميل على العمود الفقري.',
    instructions: [
      'استلقِ على ظهرك، ارفع ركبتيك بزاوية 90 درجة والذراعين مستقيمتين لأعلى.',
      'مدّ الذراع اليمنى للخلف مع إنزال الساق اليسرى ببطء بمحاذاة الأرض.',
      'عُد لنقطة البداية وبدّل للجانب المعاكس بهدوء وثبات تام. (3 مجموعات × 8 عدات لكل جانب).'
    ],
    precautions: [
      'الصق أسفل ظهرك بالأرض طوال الحركة؛ إذا شعرت بتقوس ظهرك قلل مدى نزول ساقك.'
    ],
    targetMuscles: ['جدار البطن الحامي للفقرات', 'التنسيق العصبي العضلي'],
    videoUrl: 'https://www.youtube.com/embed/tU_Cgw3XyOQ?enablejsapi=1',
    youtubeUrl: 'https://youtu.be/tU_Cgw3XyOQ',
    animationSlug: 'dead-bug',
    isFavorite: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ab-stomach-vacuum',
    name: 'Stomach Vacuum',
    arabicName: 'تفريغ البطن (Stomach Vacuum)',
    category: 'core',
    durationSeconds: 45,
    reps: 5,
    restAfterSeconds: 15,
    description: 'تفعيل مباشر لعضلة البطن المستعرضة (الكورسيه الطبيعي للجسم) المسؤولة عن تثبيت الفقرات.',
    instructions: [
      'ابدأ على أربع أو مستلقياً على ظهرك براحة.',
      'أخرج كل الهواء من رئتيك بزفير كامل وهادئ.',
      'اسحب سرتك باتجاه العمود الفقري إلى الداخل لأقصى مدى مع الثبات. (3 مجموعات × 5 عدات ثبات 10–15 ثانية).'
    ],
    precautions: [
      'حافظ على ظهرك ثابتاً ومستقيماً تماماً دون إحداث أي انحناء أو تقويس أثناء الشفط.'
    ],
    targetMuscles: ['عضلة البطن المستعرضة (Transverse Abdominis)'],
    videoUrl: 'https://www.youtube.com/embed/HEDS6XDem9E?enablejsapi=1',
    youtubeUrl: 'https://youtu.be/HEDS6XDem9E',
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ab-isometric-knee-press',
    name: 'Isometric Knee Press',
    arabicName: 'دفع الركبتين متساوي القياس (Isometric Knee Press)',
    category: 'core',
    durationSeconds: 50,
    reps: 6,
    restAfterSeconds: 15,
    description: 'تمرين ثبات بدون حركة مفصلية يولد انقباضاً عضلياً عميقاً في البطن دون أي إجهاد للفقرات.',
    instructions: [
      'استلقِ على ظهرك وركبتيك مثنيتان بزاوية 90 درجة في الهواء.',
      'ضع يديك على ركبتيك وادفعهما بيدك بينما تقاوم ركبتاك الحركة للداخل في ثبات تام.',
      'استمر في الدفع المتبادل لمدة 6 ثوانٍ مع تنفس سلس. (3 مجموعات × 6 عدات).'
    ],
    precautions: [
      'اضبط قوة الدفع بما يحافظ على راحة ظهرك؛ التثبيت أهم من القوة الزائدة.'
    ],
    targetMuscles: ['عضلات البطن المركزية', 'تثبيت الحوض'],
    videoUrl: 'https://www.youtube.com/embed/xf3d-dDhd0s?enablejsapi=1',
    youtubeUrl: 'https://youtu.be/xf3d-dDhd0s',
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ab-heel-taps',
    name: 'Heel Taps',
    arabicName: 'نقر الكعبين على الأرض (Heel Taps)',
    category: 'core',
    durationSeconds: 60,
    reps: 10,
    restAfterSeconds: 15,
    description: 'يقوي أسفل البطن ويدرب الحوض على مقاومة التقوس الزائد عند تحريك الأرجل.',
    instructions: [
      'استلقِ على ظهرك بركبتين بزاوية 90 درجة مرفوعتين في الهواء.',
      'انزل بكعب ساق واحدة لتلمس الأرض ببطء شديد مع الحفاظ على ثني الركبة.',
      'ارفع الساق وكرر مع الساق الأخرى بالتبادل. (3 مجموعات × 10 عدات لكل ساق).'
    ],
    precautions: [
      'احرص على تحريك المفصل من الفخذ فقط، مع بقاء زاوية الركبة ثابتة لمنع إجهاد الفقرات.'
    ],
    targetMuscles: ['أسفل البطن', 'ثبات عظام الحوض'],
    videoUrl: 'https://www.youtube.com/embed/8-VpH6ne28c?enablejsapi=1',
    youtubeUrl: 'https://youtu.be/8-VpH6ne28c',
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ab-elevated-plank',
    name: 'Elevated Plank',
    arabicName: 'البلانك المرتفع على حافة (Elevated Plank)',
    category: 'core',
    durationSeconds: 45,
    restAfterSeconds: 15,
    description: 'تعديل آمن ومثالي للبلانك؛ الارتفاع يقلل الضغط التجاذبي على الديسك وأسفل الظهر.',
    instructions: [
      'ضع يديك أو ساعديك على طاولة ثابتة أو حافة أريكة مرتفعة.',
      'ارجع بقدميك للخلف حتى يشكل جسمك خطاً مستقيماً مشدوداً من الرأس للكعبين.',
      'اثبت لمدة 20–30 ثانية مع شد البطن والمؤخرة. (3 مجموعات).'
    ],
    precautions: [
      'تجنب هبوط الحوض لأسفل؛ شد عضلات المؤخرة لدعم أسفل الظهر.'
    ],
    targetMuscles: ['الجذع كاملاً', 'الأكتاف', 'الألوية'],
    videoUrl: 'https://www.youtube.com/embed/tO3661y58dc?enablejsapi=1',
    youtubeUrl: 'https://youtu.be/tO3661y58dc',
    isFavorite: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ab-banded-dead-bug',
    name: 'Banded Dead Bug',
    arabicName: 'تمرين الحشرة الميتة بحزام المقاومة (Banded Dead Bug)',
    category: 'core',
    durationSeconds: 50,
    reps: 8,
    restAfterSeconds: 15,
    description: 'تطوير متقدم لتمرين Dead Bug باستخدام حزام مطاطي لزيادة تفعيل عضلات التثبيت العميقة.',
    instructions: [
      'نفس حركة الـ Dead Bug ولكن مع تثبيت حزام مطاطي خلف الرأس باليدين.',
      'حافظ على شد خفيف بالحزام بينما تمدد الأرجل بالتناوب ببطء.',
      'نفذ 3 مجموعات × 6–8 عدات لكل جانب.'
    ],
    precautions: [
      'اختر حزام مقاومة خفيفاً لمنع إجهاد الكتفين أو رفع القفص الصدري للأعلى.'
    ],
    targetMuscles: ['عضلات البطن العميقة', 'استقرار لوح الكتف'],
    videoUrl: 'https://www.youtube.com/embed/W2hfU-mLlzE?enablejsapi=1',
    youtubeUrl: 'https://youtu.be/W2hfU-mLlzE',
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ab-wall-press',
    name: 'Wall Press Core Activation',
    arabicName: 'الضغط على الحائط بالاستلقاء (Wall Press Core Activation)',
    category: 'core',
    durationSeconds: 45,
    restAfterSeconds: 15,
    description: 'استخدام الجدار لخلق مقاومة موجهة تدفع العمود الفقري إلى وضعه المحايد الآمن تماماً.',
    instructions: [
      'استلقِ على ظهرك بحيث تلامس يداك جداراً خلف رأسك مباشرة.',
      'ادفع الحائط بكفيك مع رفع الساقين بزاوية 90 درجة وتثبيت الجذع كاملاً.',
      'اثبت لمدة 15–20 ثانية مع تنفس بطيء. (3 مجموعات).'
    ],
    precautions: [
      'ركز على تسطيح ظهرك على الأرض بالتزامن مع دفع يديك للحائط.'
    ],
    targetMuscles: ['جدار البطن الداخلي', 'الفقرات القطنية'],
    videoUrl: 'https://www.youtube.com/embed/EIllWG6K6os?enablejsapi=1',
    youtubeUrl: 'https://youtu.be/EIllWG6K6os',
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ab-bear-crawl-hold',
    name: 'Bear Crawl Hold',
    arabicName: 'الدب الثابت (Bear Crawl Hold)',
    category: 'core',
    durationSeconds: 40,
    restAfterSeconds: 15,
    description: 'يقوي كامل عضلات الحزام الحركي الداخلي في وضعية الأطراف الأربعة المستقرة.',
    instructions: [
      'ابدأ على يديك وركبتيك (اليدان أسفل الكتفين والركبتان أسفل الحوض).',
      'ارفع ركبتيك سنتيمترين فقط عن الأرض مع موازاة ظهرك للأرض وشده كطاولة مسطحة.',
      'اثبت لمدة 15–25 ثانية مع الحفاظ على استقامة الرأس. (3 مجموعات).'
    ],
    precautions: [
      'لا ترفع مؤخرتك لأعلى؛ الارتفاع البسيط عن الأرض هو ما يحمي ظهرك ويشغل البطن.'
    ],
    targetMuscles: ['عضلات الجذع الرباعية', 'الأكتاف', 'الركبتان'],
    videoUrl: 'https://www.youtube.com/embed/aAlsHxv33nM?enablejsapi=1',
    youtubeUrl: 'https://youtu.be/aAlsHxv33nM',
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ab-seated-lean-back',
    name: 'Seated Lean-Back',
    arabicName: 'تراجع الجذع جالساً (Seated Lean-Back)',
    category: 'core',
    durationSeconds: 50,
    reps: 10,
    restAfterSeconds: 15,
    description: 'تمرين بسيط يمكن ممارسته أثناء العمل المكتبي لتنشيط عضلات البطن وحماية الظهر من التراخي.',
    instructions: [
      'اجلس باستقامة على طرف كرسي أو على الأرض واثنِ ركبتيك وضم يديك لصدرك.',
      'مل للخلف بجذعك بزاوية 20 درجة فقط مع الحفاظ على استقامة الظهر التامة.',
      'اثبت لثانيتين ثم عُد لوضع الجلوس المستقيم. (3 مجموعات × 8–10 عدات).'
    ],
    precautions: [
      'حافظ على صدرك مرفوعاً للأعلى ولا تسمح لظهرك بالانحناء على شكل حرف C.'
    ],
    targetMuscles: ['عضلات البطن العلوية', 'استقامة الجذع والرقبة'],
    videoUrl: 'https://www.youtube.com/embed/Yr0eXC8tU3E?enablejsapi=1',
    youtubeUrl: 'https://youtu.be/Yr0eXC8tU3E',
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },

  // ==========================================
  // 2. تمارين الجوانب (Obliques) - 10 تمارين
  // ==========================================
  {
    id: 'obl-side-plank-knees',
    name: 'Side Plank on Knees',
    arabicName: 'البلانك الجانبي على الركبتين (Side Plank on Knees)',
    category: 'core',
    durationSeconds: 45,
    restAfterSeconds: 15,
    description: 'الركيزة الثانية في ثلاثية ماكجيل؛ تقوي عضلات الخصر المربعة (Quadratus Lumborum) الحامية للفقرات.',
    instructions: [
      'استلقِ على جنبك مستنداً على ساعدك، واثنِ ركبتيك 90 درجة للخلف.',
      'ارفع الحوض للأعلى ليصبح جسمك مستقيماً من الكتف للركبة.',
      'اثبت لمدة 15–25 ثانية لكل جانب. (3 مجموعات).'
    ],
    precautions: [
      'تأكد من أن كوعك يقع تحت مفصل كتفك مباشرة لتفادي الحمل الزائد على المفاصل.'
    ],
    targetMuscles: ['عضلة الخصر المربعة (QL)', 'العضلات المائلة'],
    videoUrl: 'https://www.youtube.com/embed/UurF0EhHFLg?enablejsapi=1',
    youtubeUrl: 'https://www.youtube.com/watch?v=UurF0EhHFLg',
    isFavorite: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'obl-clamshell',
    name: 'Clamshells',
    arabicName: 'المحار (Clamshells)',
    category: 'legs',
    durationSeconds: 50,
    reps: 12,
    restAfterSeconds: 15,
    description: 'يقوي العضلة الألوية الوسطى (Gluteus Medius) التي تثبت الحوض وتمنع ميلانه المسبب لآلام الديسك.',
    instructions: [
      'استلقِ على جانبك مع ثني الركبتين وتلاصق القدمين معاً.',
      'ارفع ركبتك العلوية لأعلى قدر المستطاع ببطء مع إبقاء كعبي القدمين متلامسين.',
      'انزل بهدوء وكرر. (3 مجموعات × 12–15 عدة لكل جانب).'
    ],
    precautions: [
      'ثبّت حوضك تماماً للأمام ولا تدعه يتدحرج للخلف أثناء رفع الركبة.'
    ],
    targetMuscles: ['الألوية الوسطى (Glute Med)', 'استقرار مفصل الفخذ'],
    videoUrl: 'https://www.youtube.com/embed/39vuP5xozsI?enablejsapi=1',
    youtubeUrl: 'https://www.youtube.com/watch?v=39vuP5xozsI',
    isFavorite: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'obl-pallof-press',
    name: 'Pallof Press',
    arabicName: 'البالوف بريس بالحزام (Pallof Press)',
    category: 'core',
    durationSeconds: 50,
    reps: 10,
    restAfterSeconds: 15,
    description: 'التمرين الأقوى لمقاومة الالتفاف والدوران الضار بالعمود الفقري.',
    instructions: [
      'قف باستقامة وامسك بحبل مقاومة مثبت بجانبك عند مستوى الصدر.',
      'ادفع الحبل للأمام بيديك الاثنتين مع مقاومة دوران الجذع نحو مصدر الشد.',
      'اثبت لثانية ثم عُد لصدرك ببطء. (3 مجموعات × 8–10 عدات لكل جانب).'
    ],
    precautions: [
      'ثبت حوضك للأمام وقاوم أي التفاف؛ الحركة تعتمد بالكامل على منع الدوران.'
    ],
    targetMuscles: ['مقاومة الدوران (Anti-Rotation)', 'الجذع الجانبي'],
    videoUrl: 'https://www.youtube.com/embed/99evyH71IWs?enablejsapi=1',
    youtubeUrl: 'https://www.youtube.com/shorts/99evyH71IWs',
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'obl-suitcase-carry',
    name: 'Suitcase Carry',
    arabicName: 'حمل الحقيبة بوزن في يد واحدة (Suitcase Carry)',
    category: 'core',
    durationSeconds: 60,
    restAfterSeconds: 15,
    description: 'تمرين وظيفي يومي يدرب الجسم على التوازن واستقامة القامة أثناء المشي والحمل.',
    instructions: [
      'احمل وزناً خفيفاً بيد واحدة وامشِ بخطى هادئة ومستقيمة.',
      'لا تسمح لكتفك أو جذعك بالميلان جهة الوزن أو الجهة العكسية.',
      'امشِ لمدة 30–40 ثانية ثم بدل لليد الأخرى. (3 مجموعات).'
    ],
    precautions: [
      'قف مستقيماً وأكتافك متوازية ومتراجعة للخلف لتجنب التحميل غير المتوازن على الفقرات.'
    ],
    targetMuscles: ['العضلات المائلة', 'عضلة أسفل الظهر الجانبية', 'قوة القبضة'],
    videoUrl: 'https://www.youtube.com/embed/iTjwbts8Djw?enablejsapi=1',
    youtubeUrl: 'https://www.youtube.com/shorts/iTjwbts8Djw',
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'obl-side-lying-leg-lift',
    name: 'Side-Lying Leg Lift',
    arabicName: 'رفع الساق الجانبي بالاستلقاء (Side-Lying Leg Lift)',
    category: 'legs',
    durationSeconds: 50,
    reps: 12,
    restAfterSeconds: 15,
    description: 'عزل ممتاز لعضلات الحوض الجانبية دون أي ضغط محوري على فقرات الظهر.',
    instructions: [
      'استلقِ على جنبك بجسم مفرود تماماً في خط مستقيم.',
      'ارفع ساقك العلوية لأعلى بمسافة 30 سم تقريباً ببطء وتحكم.',
      'انزل بهدوء وكرر. (3 مجموعات × 10–12 عدة لكل جانب).'
    ],
    precautions: [
      'وجه أصابع قدمك للأمام أو قليلاً للأسفل لتفعيل العضلة الجانبية وتفادي إجهاد القطنية.'
    ],
    targetMuscles: ['الألوية الجانبية', 'مبعدات الفخذ'],
    videoUrl: 'https://www.youtube.com/embed/APQCbx82Aa0?enablejsapi=1',
    youtubeUrl: 'https://www.youtube.com/shorts/APQCbx82Aa0',
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'obl-wall-side-plank',
    name: 'Wall Side Plank',
    arabicName: 'البلانك الجانبي بالحائط (Wall Side Plank)',
    category: 'core',
    durationSeconds: 60,
    restAfterSeconds: 15,
    description: 'بديل آمن جداً للبلانك الأرضي، مناسب لمن يعانون من آلام حادة أو صعوبة الاستلقاء.',
    instructions: [
      'قف بجانب جدار وضع ساعدك عليه مع إمالة جسمك قليلاً نحو الحائط.',
      'شد خصرك وجذعك لتكون في خط مستقيم مائل وثابت.',
      'اثبت لمدة 30 ثانية لكل جانب. (3 مجموعات).'
    ],
    precautions: [
      'هذا الخيار ممتاز وآمن جداً في حال كان تمرين الأرض يسبب ضغطاً غير مريح على الظهر.'
    ],
    targetMuscles: ['الخصر', 'ثبات الكتف'],
    videoUrl: 'https://www.youtube.com/embed/_VYXA9xO4PE?enablejsapi=1',
    youtubeUrl: 'https://www.youtube.com/shorts/_VYXA9xO4PE',
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'obl-half-kneeling-chop',
    name: 'Half-Kneeling Chop Hold',
    arabicName: 'ثبات الدوران نصف راكع (Half-Kneeling Chop Hold)',
    category: 'core',
    durationSeconds: 45,
    restAfterSeconds: 15,
    description: 'يثبت الحوض ويمنع التواء أسفل الظهر مع بناء قوة حزام الخصر.',
    instructions: [
      'انزل بوضعية نصف ركوع (ركبة على الأرض والأخرى مثنية للأمام 90 درجة).',
      'امسك حبل مقاومة من الجانب واجذبه باتجاه ركبتك السفلية واثبت.',
      'حافظ على ثبات الجذع التام دون أي دوران. (3 مجموعات ثبات 15 ثانية لكل جهة).'
    ],
    precautions: [
      'اعصر عضلات المؤخرة في الساق التي تستند على ركبتها لحماية أسفل الظهر ومنع انحنائه.'
    ],
    targetMuscles: ['الجذع القطري', 'ثبات مفصل الحوض'],
    videoUrl: 'https://www.youtube.com/embed/3H1-2Hk91mU?enablejsapi=1',
    youtubeUrl: 'https://www.youtube.com/shorts/3H1-2Hk91mU',
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'obl-contralateral-deadbug',
    name: 'Contralateral Dead Bug Hold',
    arabicName: 'الحشرة الميتة الجانبية المتعارضة (Contralateral Dead Bug Hold)',
    category: 'core',
    durationSeconds: 45,
    reps: 6,
    restAfterSeconds: 15,
    description: 'يولد شداً متعارضاً يربط لوح الكتف بالورك العكسي لدعم الحزام الشوكي.',
    instructions: [
      'استلقِ على ظهرك وضع يدك اليمنى على ركبتك اليسرى واضغط بينهما بقوة.',
      'افرد الساق والذراع الأخريين وثبت الجذع كاملاً.',
      'اثبت لـ 6 ثوانٍ وبدل. (3 مجموعات × 6 عدات لكل جانب).'
    ],
    precautions: [
      'تأكد من أن الدفع المتقاطع لا يرفع أي جانب من ظهرك عن الأرض.'
    ],
    targetMuscles: ['الخط المائل الحركي للجسم', 'البطن العميقة'],
    videoUrl: 'https://www.youtube.com/embed/1ZjGYMX4IpY?enablejsapi=1',
    youtubeUrl: 'https://www.youtube.com/shorts/1ZjGYMX4IpY',
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'obl-fire-hydrant',
    name: 'Fire Hydrant',
    arabicName: 'رفع الساق مع ثني الركبة الجانبي (Fire Hydrant)',
    category: 'legs',
    durationSeconds: 50,
    reps: 10,
    restAfterSeconds: 15,
    description: 'تحريك مفصل الفخذ جانبياً مع عزل الظهر التام لمنع التيبس العضلي.',
    instructions: [
      'على أربع، ارفع ساقك للجانب مع الحفاظ على ثني الركبة 90 درجة إلى مستوى الحوض.',
      'انزل بهدوء وتحكم كامل. (3 مجموعات × 10 عدات لكل جانب).'
    ],
    precautions: [
      'لا تُمِل ظهرك أو جذعك للجهة المعاكسة؛ دع الحركة تخرج من مفصل الحوض فقط.'
    ],
    targetMuscles: ['الألوية الخارجية', 'مرونة محفظة الحوض'],
    videoUrl: 'https://www.youtube.com/embed/IRkRgk2Gc1E?enablejsapi=1',
    youtubeUrl: 'https://www.youtube.com/watch?v=IRkRgk2Gc1E',
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'obl-kickstand-bridge',
    name: 'Kickstand Glute Bridge',
    arabicName: 'تمرين الجسر برجل واحدة مدعومة (Kickstand Glute Bridge)',
    category: 'back',
    durationSeconds: 50,
    reps: 10,
    restAfterSeconds: 15,
    description: 'جسر ألوية يركز على جانب واحد مع توفير دعم خفيف من الرجل الأخرى لمنع الالتواء.',
    instructions: [
      'وضعية الجسر العادية، وضع ساقاً بكامل القدم والأخرى ترتكز على الكعب أبعد قليلاً.',
      'ارفع الحوض مع التركيز على الدفع من الساق الأساسية.',
      'نفذ 3 مجموعات × 8–10 عدات لكل جهة.'
    ],
    precautions: [
      'حافظ على استواء الحوض بحيث يكون عظمتا الحوض على نفس الارتفاع تماماً دون ميلان.'
    ],
    targetMuscles: ['الألوية أحادية الجانب', 'استقرار الحوض والقطنية'],
    videoUrl: 'https://www.youtube.com/embed/nEQaMjD78sY?enablejsapi=1',
    youtubeUrl: 'https://www.youtube.com/shorts/nEQaMjD78sY',
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },

  // ==========================================
  // 3. تمارين الظهر (Back & Posterior) - 10 تمارين
  // ==========================================
  {
    id: 'bk-bird-dog',
    name: 'Bird Dog',
    arabicName: 'الطائر والكلب (Bird Dog)',
    category: 'back',
    durationSeconds: 60,
    reps: 8,
    restAfterSeconds: 15,
    description: 'الركيزة الثالثة في ثلاثية ماكجيل؛ تقوية متكاملة لعضلات الظهر الباسطة دون أي ضغط ضاغط على الغضاريف.',
    instructions: [
      'على يديك وركبتيك، ارفع الذراع اليمنى والساق اليسرى ببطء بمستوى الظهر.',
      'اثبت لثانيتين مع عصر عضلات البطن والأرداف.',
      'عُد وبدل للجانب الآخر. (3 مجموعات × 8 عدات لكل جانب).'
    ],
    precautions: [
      'لا ترفع يدك أو رجلك أعلى من مستوى ظهرك لتفادي تقويس الفقرات القطنية.'
    ],
    targetMuscles: ['عضلات الظهر الناصبة (Erector Spinae)', 'الألوية', 'الجذع'],
    videoUrl: 'https://www.youtube.com/embed/knsOPG88idk?enablejsapi=1',
    youtubeUrl: 'https://www.youtube.com/shorts/knsOPG88idk',
    animationSlug: 'bird-dog',
    isFavorite: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bk-glute-bridge',
    name: 'Glute Bridge',
    arabicName: 'الجسر (Glute Bridge)',
    category: 'back',
    durationSeconds: 50,
    reps: 12,
    restAfterSeconds: 15,
    description: 'بناء قوة الألوية لتولي مهمة حمل الجذع وتخفيف الحمل المستمر عن الفقرات القطنية.',
    instructions: [
      'استلقِ على ظهرك بركبتين مثنيتين وقدمين مسطحتين على الأرض.',
      'ارفع الحوض للأعلى بالضغط على الكعبين وشد الأرداف حتى يستقيم الجذع.',
      'انزل ببطء وتحكم. (3 مجموعات × 10–12 عدة).'
    ],
    precautions: [
      'توقف فور وصول جسمك لخط مستقيم، وامتنع عن الدفع الزائد للأعلى الذي يجهد أسفل الظهر.'
    ],
    targetMuscles: ['الألوية الكبرى (Glute Max)', 'أوتار الركبة', 'استقرار القطنية'],
    videoUrl: 'https://www.youtube.com/embed/RrU4zx4ysnI?enablejsapi=1',
    youtubeUrl: 'https://www.youtube.com/shorts/RrU4zx4ysnI',
    animationSlug: 'glute-bridge',
    isFavorite: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bk-prone-arm-leg-lift',
    name: 'Prone Arm/Leg Lift',
    arabicName: 'سوبرمان المعدل بالتناوب (Prone Arm/Leg Lift)',
    category: 'back',
    durationSeconds: 50,
    reps: 10,
    restAfterSeconds: 15,
    description: 'تعديل علاجي آمن لحركة سوبرمان، يرفع طرفاً واحداً بالتناوب مع دعم وسادة لحماية الفقرات.',
    instructions: [
      'استلقِ على بطنك مع وضع وسادة صغيرة تحت الحوض لتقليل التقوس.',
      'ارفع ذراعاً واحدة مع الساق العكسية مسافة سنتيمترات قليلة عن الأرض.',
      'انزل بهدوء وبدل. (3 مجموعات × 8–10 عدات لكل جانب).'
    ],
    precautions: [
      'الوسادة أسفل الحوض إلزامية لتقليل تقوس الفقرات القطنية، ولا ترفع الطرفين معاً في نفس الوقت.'
    ],
    targetMuscles: ['عضلات الظهر السفلية والعلوية', 'الألوية'],
    videoUrl: 'https://www.youtube.com/embed/1u9t36-9EOE?enablejsapi=1',
    youtubeUrl: 'https://www.youtube.com/shorts/1u9t36-9EOE',
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bk-prone-cobra',
    name: 'Prone Cobra / Extension in Lying',
    arabicName: 'تمرين الكوبرا الخفيف (Prone Cobra / Extension in Lying)',
    category: 'back',
    durationSeconds: 45,
    reps: 8,
    restAfterSeconds: 15,
    description: 'تمرين ماكنزي الشهير للمساعدة في إعادة تمركز نواة الديسك المنزلق وتنشيط أعلى الظهر.',
    instructions: [
      'استلقِ على بطنك وضع ذراعيك بجانبك موجهتين للخلف.',
      'ارفع صدرك قليلاً عن الأرض مع عصر لوحي الكتف للخلف والأسفل وتوجيه الإبهام للسقف.',
      'اثبت لمدة 3–5 ثوانٍ مع التنفس. (3 مجموعات × 8 عدات).'
    ],
    precautions: [
      'لا تستخدم أسفل الظهر لرفع جسمك؛ الحركة يجب أن تركز على عضلات أعلى الظهر ولوحي الكتف.'
    ],
    targetMuscles: ['عضلات ما بين لوحي الكتف', 'الامتداد الصدري'],
    videoUrl: 'https://www.youtube.com/embed/80TrX8LltX4?enablejsapi=1',
    youtubeUrl: 'https://www.youtube.com/shorts/80TrX8LltX4',
    isFavorite: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bk-prone-w-to-y',
    name: 'Prone W-to-Y Raises',
    arabicName: 'تمرين W إلى Y بالاستلقاء على البطن (Prone W-to-Y Raises)',
    category: 'neck',
    durationSeconds: 45,
    reps: 8,
    restAfterSeconds: 15,
    description: 'يقوي العضلات الرافعة لأعلى الظهر ومثبتات لوح الكتف لمقاومة الانحناء المكتبي.',
    instructions: [
      'مستلقياً على بطنك مع وضع الجبين على منشفة صغيرة، شكل ذراعيك بحرف W.',
      'ارفع كفيك وكوعيك قليلاً للأعلى، ثم مدهما للأمام على شكل حرف Y وانزل.',
      'كرر ببطء وتحكم. (3 مجموعات × 8 عدات).'
    ],
    precautions: [
      'ثبت قدميك وبطنك بالكامل على الأرض وركز فقط على تحريك الجزء العلوي وعظام اللوح.'
    ],
    targetMuscles: ['عضلات أعلى الظهر', 'لوح الكتف', 'الرقبة الخلفية'],
    videoUrl: 'https://www.youtube.com/embed/9ggm-DCrM1o?enablejsapi=1',
    youtubeUrl: 'https://www.youtube.com/shorts/9ggm-DCrM1o',
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bk-seated-band-row',
    name: 'Seated Resistance Band Row',
    arabicName: 'سحب الكابل أو الحزام جالساً (Seated Resistance Band Row)',
    category: 'back',
    durationSeconds: 50,
    reps: 12,
    restAfterSeconds: 15,
    description: 'تقوية عضلات الظهر الوسطى والكتفين في وضعية جلوس مريحة وثابتة.',
    instructions: [
      'اجلس على كرسي أو على الأرض وظهرك مستقيم جداً.',
      'امسك حزام مقاومة مثبت أمامك، واجذبه باتجاه بطنك مع ضم لوحي الكتف ببطء.',
      'اثبت لثانية وانزل بهدوء. (3 مجموعات × 10–12 عدة).'
    ],
    precautions: [
      'لا تتمايل للأمام وللخلف مع الحركة؛ ثبّت عمودك الفقري في وضع مستقيم طوال السحب.'
    ],
    targetMuscles: ['عضلات الظهر العريضة (Lats)', 'بين لوحي الكتف'],
    videoUrl: 'https://www.youtube.com/embed/bBpK36TAQww?enablejsapi=1',
    youtubeUrl: 'https://www.youtube.com/shorts/bBpK36TAQww',
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bk-wall-angels',
    name: 'Wall Angels',
    arabicName: 'انزلاق الحائط للكتفين وأعلى الظهر (Wall Angels)',
    category: 'neck',
    durationSeconds: 50,
    reps: 10,
    restAfterSeconds: 15,
    description: 'يصحح تحدب الظهر ويفتح القفص الصدري ويفك تشنجات الرقبة وأعلى الظهر.',
    instructions: [
      'قف مسنداً رأسك، ظهرك، وأسفل ظهرك تماماً على الحائط.',
      'اثنِ ذراعيك 90 درجة مع لمس الحائط، ثم ارفعهما لأعلى مع الحفاظ على الالتصاق بالحائط.',
      'انزل ببطء. (3 مجموعات × 8–10 عدات).'
    ],
    precautions: [
      'اثنِ ركبتيك قليلاً لمساعدتك في إبقاء أسفل ظهرك مسطحاً تماماً على الجدار دون تقوس.'
    ],
    targetMuscles: ['أعلى الظهر', 'الكتفان', 'القوام السليم'],
    videoUrl: 'https://www.youtube.com/embed/BdEXk-wHyfE?enablejsapi=1',
    youtubeUrl: 'https://www.youtube.com/shorts/BdEXk-wHyfE',
    animationSlug: 'wall-angels',
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bk-gentle-cat-camel',
    name: 'Gentle Cat-Camel',
    arabicName: 'تمرين القطة والجمال الخفيف (Gentle Cat-Camel)',
    category: 'mobility',
    durationSeconds: 60,
    reps: 8,
    restAfterSeconds: 15,
    description: 'تحريك وتزييت فقرات الظهر بالكامل بلطف شديد دون أي ضغط مجهد.',
    instructions: [
      'على يديك وركبتيك، قوس ظهرك برفق للأعلى كالقطة مع خفض رأسك.',
      'انتقل ببطء شديد إلى وضعية مستقيمة (أو تقوس خفيف جداً للأدنى دون أي ضغط).',
      'كرر بسلاسة متزامنة مع التنفس. (2–3 مجموعات × 6–8 عدات).'
    ],
    precautions: [
      'استخدم الحركة بهدف التليين والحركة المفصلية فقط، ولا تضغط بقوة في نهايات المدى الحركي.'
    ],
    targetMuscles: ['تليين العمود الفقري بالكامل', 'الرقبة'],
    videoUrl: 'https://www.youtube.com/embed/YX5WyUjmvQs?enablejsapi=1',
    youtubeUrl: 'https://www.youtube.com/shorts/YX5WyUjmvQs',
    animationSlug: 'cat-cow',
    isFavorite: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bk-standing-lumbar-extension',
    name: 'Standing Lumbar Extension',
    arabicName: 'مد الظهر أثناء الوقوف (Standing Lumbar Extension)',
    category: 'mobility',
    durationSeconds: 45,
    reps: 8,
    restAfterSeconds: 15,
    description: 'حركة استشفائية فورية تعاكس وضعية الجلوس الطويلة وتعيد الديسك لوضعه الطبيعي.',
    instructions: [
      'قف باستقامة، وضع يديك خلف أسفل ظهرك كدعامة للحوض.',
      'مل بجذعك للخلف مسافة بسيطة ومريحة جداً لثانية واحدة مع الزفير ثم عُد.',
      'كرر بهدوء. (2–3 مجموعات × 6–8 عدات).'
    ],
    precautions: [
      'اثنِ جذعك بحدود الراحة التامة؛ توقف فوراً إذا شعرت بوخز حاد أو امتداد للألم بالساق.'
    ],
    targetMuscles: ['تفريغ ضغط الفقرات القطنية'],
    videoUrl: 'https://www.youtube.com/embed/dE-kn06mxp8?enablejsapi=1',
    youtubeUrl: 'https://www.youtube.com/shorts/dE-kn06mxp8',
    isFavorite: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bk-glute-bridge-squeeze',
    name: 'Glute Bridge with Squeeze',
    arabicName: 'تمرين الجسر مع ضم وسادة (Glute Bridge with Squeeze)',
    category: 'back',
    durationSeconds: 50,
    reps: 10,
    restAfterSeconds: 15,
    description: 'ضم الوسادة يفعّل العضلات المقربة ويثبت عظام الحوض لحماية إضافية للفقرات.',
    instructions: [
      'نفس تمرين الجسر العادي، لكن مع وضع وسادة صغيرة بين ركبتيك.',
      'اضغط برفق على الوسادة طوال مرحلة الصعود والنزول.',
      'نفذ 3 مجموعات × 10 عدات.'
    ],
    precautions: [
      'الضغط على الوسادة يفعّل العضلات المقربة ويثبت عظام الحوض، مما يخفف التواء وحِمل الفقرات القطنية.'
    ],
    targetMuscles: ['الألوية', 'العضلات الضامة المقربة للفخذ (Adductors)', 'الحوض'],
    videoUrl: 'https://www.youtube.com/embed/DC4pQlsXSeg?enablejsapi=1',
    youtubeUrl: 'https://www.youtube.com/shorts/DC4pQlsXSeg',
    isFavorite: false,
    createdAt: new Date().toISOString(),
  }
];

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

// ============================================================
// الخطة العلاجية للأربعة أسابيع المتكاملة (The 4-Week Comprehensive Plan)
// المستخرجة من البرنامج التدريبي الطبي لحماية الغضروف والعمود الفقري
// ============================================================
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

// ============================================================
// خطة المستويات الثلاثة (The 3 Progression Levels Plan)
// من الدليل الطبي (Untitled-1)
// ============================================================
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

// جدول الأسبوع المهيكل الافتراضي (السبت A، الإثنين B، الأربعاء C، الخميس D) + (الأحد، الثلاثاء، الجمعة راحة)
export const INITIAL_WEEKLY_SCHEDULE: WeeklyScheduleItem[] = [
  { dayOfWeek: 6, dayNameAr: 'السبت', routineId: 'routine-w1-sA', sessionCode: 'A', weekNumber: 1 },
  { dayOfWeek: 0, dayNameAr: 'الأحد', routineId: null, isRestDay: true, restReason: 'راحة سلبية أو مشي خفيف (15–20 دقيقة) لتروية الأنسجة' },
  { dayOfWeek: 1, dayNameAr: 'الاثنين', routineId: 'routine-w1-sB', sessionCode: 'B', weekNumber: 1 },
  { dayOfWeek: 2, dayNameAr: 'الثلاثاء', routineId: null, isRestDay: true, restReason: 'راحة واستشفاء للغضاريف' },
  { dayOfWeek: 3, dayNameAr: 'الأربعاء', routineId: 'routine-w1-sC', sessionCode: 'C', weekNumber: 1 },
  { dayOfWeek: 4, dayNameAr: 'الخميس', routineId: 'routine-w1-sD', sessionCode: 'D', weekNumber: 1 },
  { dayOfWeek: 5, dayNameAr: 'الجمعة', routineId: null, isRestDay: true, restReason: 'راحة تامة واستشفاء أسبوعي' },
];

export const DEFAULT_USER_SETTINGS: UserSettings = {
  id: 'current_settings',
  userName: 'صديقي البطل',
  theme: 'dark',
  activePlanType: '4-weeks',
  currentWeekNumber: 1,
  currentLevelNumber: 1,
  soundBeepsEnabled: true,
  voiceCoachEnabled: true,
  voiceLanguage: 'ar',
  defaultRestSeconds: 15,
  reminderEnabled: true,
  reminderTime: '18:30', // 6:30 PM (المساء بعد العودة من العمل كما في الدليل الطبي)
  reminderDays: [6, 1, 3, 4], // السبت، الإثنين، الأربعاء، الخميس
  workBreakReminderEnabled: true,
  workBreakIntervalMinutes: 50, // كل 50 دقيقة أثناء ساعات العمل
  screenWakeLock: true,
  workoutVideoAutoplay: true,
  workoutVideoMuted: true,
  workoutVideoLoop: true,
  workoutDefaultViewMode: 'video',
};
