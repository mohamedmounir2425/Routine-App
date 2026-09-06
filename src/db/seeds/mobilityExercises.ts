import { Exercise } from '../../types';

export const MOBILITY_EXERCISES: Exercise[] = [
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
  },
];
