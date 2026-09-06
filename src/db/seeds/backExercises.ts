import { Exercise } from '../../types';

export const BACK_EXERCISES: Exercise[] = [
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

];
