import { PlanCategory } from '../../types';

export interface PlanStarterTemplate {
  id: string;
  title: string;
  category: PlanCategory;
  description: string;
  icon: string;
  color: string;
  milestones: Array<{ title: string; order: number }>;
}

export const PLAN_STARTER_TEMPLATES: PlanStarterTemplate[] = [
  {
    id: 'tpl_dotnet',
    title: 'إتقان .NET وتطوير الأنظمة السحابية',
    category: 'career',
    description: 'خارطة طريق متكاملة للتمكن من بيئة .NET 9 وبناء APIs معمارية نظيفة وقابلة للتوسع.',
    icon: '💻',
    color: '#0284c7', // sky-600
    milestones: [
      { title: 'إتقان أساسيات C# والمفاهيم المتقدمة (OOP, Generics, LINQ)', order: 1 },
      { title: 'بناء Web APIs باستخدام ASP.NET Core و Entity Framework Core', order: 2 },
      { title: 'تطبيق Clean Architecture ونمط CQRS وحقن التبعيات', order: 3 },
      { title: 'اختبارات الوحدة والنشر السحابي مع Docker و CI/CD', order: 4 },
    ],
  },
  {
    id: 'tpl_quran',
    title: 'خطة حفظ ومراجعة القرآن الكريم',
    category: 'faith',
    description: 'منهجية هادئة وثابتة لحفظ أجزاء من كتاب الله مع التثبيت الدوري والتلاوة اليومية.',
    icon: '📖',
    color: '#059669', // emerald-600
    milestones: [
      { title: 'حفظ وتثبيت جزء عمّ كاملاً مع إتقان مخارج الحروف', order: 1 },
      { title: 'حفظ وتثبيت جزء تبارك مع الاستماع لقرّاء متقنين', order: 2 },
      { title: 'حفظ سورتي البقرة وآل عمران مع المراجعة الأسبوعية', order: 3 },
      { title: 'إتمام مراجعة وتثبيت خمسة أجزاء متتالية', order: 4 },
    ],
  },
  {
    id: 'tpl_fitness',
    title: 'تحسين اللياقة وتخفيف الضغط على الفقرات',
    category: 'health',
    description: 'برنامج حركي وتأهيلي مستمر لتخفيف آلام الظهر، تقوية الجذع، وبناء نمط معيشي نشط.',
    icon: '🏋️',
    color: '#0d9488', // teal-600
    milestones: [
      { title: 'تثبيت عادة المشي اليومي 8000 خطوة والإطالات الصباحية', order: 1 },
      { title: 'إتقان تمارين McGill Big 3 لحماية العمود الفقري 3 مرات أسبوعياً', order: 2 },
      { title: 'الانتظام في تمارين القوة وتمارين الجذع لمدة شهر كامل', order: 3 },
      { title: 'الوصول للوزن الصحي المستهدف وتحسين مرونة المفاصل', order: 4 },
    ],
  },
  {
    id: 'tpl_car',
    title: 'خطة ادخار وشراء سيارة عائلية',
    category: 'finance',
    description: 'خطة مالية واضحة لتحديد الميزانية، ادخار الدفعة الأولى، واختيار السيارة الأنسب.',
    icon: '🚗',
    color: '#d97706', // amber-600
    milestones: [
      { title: 'تحديد الميزانية الإجمالية وتكاليف الصيانة والتشغيل المتوقعة', order: 1 },
      { title: 'ادخار الدفعة الأولى وتخصيص حساب توفير مخصص', order: 2 },
      { title: 'مقارنة 3 طرازات ملائمة، فحص السوق، وتجربة القيادة', order: 3 },
      { title: 'إتمام الشراء، الفحص الفني، والتأمين الشامل', order: 4 },
    ],
  },
  {
    id: 'tpl_career',
    title: 'تطوير المسار المهني والترقية',
    category: 'personal',
    description: 'خطوات عملية لرفع القيمة السوقية، تحديث البورتفوليو، والحصول على فرص وظيفية أعلى.',
    icon: '🚀',
    color: '#6366f1', // indigo-600
    milestones: [
      { title: 'تحديث السيرة الذاتية وملف LinkedIn ونماذج الأعمال السابقة', order: 1 },
      { title: 'الحصول على شهادة تخصصية معتمدة أو إنهاء دورة تدريبية رائدة', order: 2 },
      { title: 'توسيع شبكة العلاقات المهنية وحضور مؤتمرات تقنية', order: 3 },
      { title: 'التقدم للترقية أو الانتقال لموقع وظيفي يواكب الطموح', order: 4 },
    ],
  },
];
