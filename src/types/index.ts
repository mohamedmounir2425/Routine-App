export type MuscleCategory = 'back' | 'core' | 'mobility' | 'neck' | 'legs';

export interface Exercise {
  id: string;
  name: string;
  arabicName: string;
  category: MuscleCategory;
  durationSeconds: number; // default time in seconds (e.g., 60s)
  reps?: number;           // optional reps (e.g. 10 reps)
  restAfterSeconds: number;// default rest after (e.g. 15s)
  description: string;
  instructions: string[];
  precautions?: string[];  // نصائح هامة لمرضى الانزلاق الغضروفي وآلام الظهر
  targetMuscles: string[];
  videoUrl?: string;       // Embed URL
  youtubeUrl?: string;     // Original YouTube link
  animationSlug?: string;  // slug for built-in visual animation
  isFavorite?: boolean;
  createdAt: string;
}

export interface ExercisePrescription {
  exerciseId: string;
  sets: number;
  reps?: number;
  durationSeconds?: number;
  holdSeconds?: number;
  restSeconds?: number;
  sides?: 'none' | 'each';
  notes?: string;
}

export interface PlanSession {
  id: string;
  sessionCode: 'A' | 'B' | 'C' | 'D';
  title: string;
  description: string;
  estimatedMinutes: number;
  dayOfWeek: number; // 6 = السبت, 1 = الإثنين, 3 = الأربعاء, 4 = الخميس
  dayNameAr: string;
  prescriptions: ExercisePrescription[];
  routineId: string;
}

export interface PlanWeek {
  weekNumber: number;
  title: string;
  description: string;
  focus: string;
  sessions: PlanSession[];
}

export interface PlanLevel {
  levelNumber: 1 | 2 | 3;
  title: string;
  subtitle: string;
  durationWeeks: string;
  goal: string;
  rules: string[];
  sections: {
    title: string;
    category: MuscleCategory | 'warmup';
    exercises: (ExercisePrescription & { arabicName: string; englishName: string })[];
  }[];
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  exerciseIds: string[];
  totalEstimatedMinutes: number;
  level: 'gentle' | 'moderate' | 'deep';
  tag: string;
  isDefault?: boolean;
  isCustom?: boolean;
  isMiniRescue?: boolean;  // هل هذا روتين الإنقاذ السريع (5 دقائق)؟
  planSessionId?: string;  // ربط مع جلسة الخطة إذا كان روتيناً للخطة
  weekNumber?: number;
  sessionCode?: 'A' | 'B' | 'C' | 'D';
  prescriptions?: ExercisePrescription[];
  customExerciseConfigs?: { [exerciseId: string]: { durationSeconds?: number; restAfterSeconds?: number; reps?: number } };
}

export interface WeeklyScheduleItem {
  dayOfWeek: number; // 0 = الأحد, 1 = الاثنين, 2 = الثلاثاء, 3 = الأربعاء, 4 = الخميس, 5 = الجمعة, 6 = السبت
  dayNameAr: string;
  routineId: string | null; // null = يوم راحة
  isRestDay?: boolean;
  restReason?: string;
  sessionCode?: 'A' | 'B' | 'C' | 'D';
  weekNumber?: number;
}

export interface WorkoutLog {
  id: string;
  routineId: string;
  routineName: string;
  completedAt: string; // ISO string (e.g. 2026-09-04T22:30:00Z)
  durationMinutes: number;
  exercisesCompleted: number;
  totalExercises: number;
  weekNumber?: number;
  sessionCode?: 'A' | 'B' | 'C' | 'D';
  prePainScore?: number;  // 0 (لا يوجد ألم) إلى 10 (ألم شديد)
  postPainScore?: number; // تقييم ما بعد التمرين
  difficultyRating?: 'easy' | 'moderate' | 'challenging' | 'hard'; // تقييم شعور الجلسة (إيموجي)
  notes?: string;
}

export interface UserSettings {
  id: string; // 'current_settings'
  userName: string;
  theme?: 'dark' | 'light';
  activePlanType: '4-weeks' | '3-levels';
  currentWeekNumber: number; // 1, 2, 3, 4
  currentLevelNumber: 1 | 2 | 3; // 1, 2, 3
  soundBeepsEnabled: boolean;
  voiceCoachEnabled: boolean;
  voiceLanguage: 'ar' | 'en';
  defaultRestSeconds: number;
  reminderEnabled: boolean;
  reminderTime: string; // "18:30" (6:30 PM - optimal time)
  reminderDays: number[]; // [6, 1, 3, 4]
  workBreakReminderEnabled: boolean;
  workBreakIntervalMinutes: number; // 45-60 mins
  screenWakeLock: boolean;
  workoutVideoAutoplay?: boolean; // تشغيل فيديو اليوتيوب تلقائياً
  workoutVideoMuted?: boolean; // كتم صوت فيديو اليوتيوب
  workoutVideoLoop?: boolean; // تكرار تشغيل الفيديو عند انتهائه
  workoutDefaultViewMode?: 'video' | 'animation'; // نمط العرض الافتراضي
  enabledSpaces?: string[]; // IDs of enabled spaces (e.g. 'worship', 'health', 'work', etc.)
  hasCompletedOnboarding?: boolean; // هل أكمل شاشة الإعداد الأولى
}

export * from './spaces';
export * from './tasks';
export * from './lifeOs';
