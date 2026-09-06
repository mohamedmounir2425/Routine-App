import { Exercise } from '../../types';

export const CORE_EXERCISES: Exercise[] = [
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

];
