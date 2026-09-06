import { UserSettings, WeeklyScheduleItem } from '../../types';

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

