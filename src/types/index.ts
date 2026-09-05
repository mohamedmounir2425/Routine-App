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

export interface Routine {
  id: string;
  name: string;
  description: string;
  exerciseIds: string[];
  totalEstimatedMinutes: number;
  level: 'gentle' | 'moderate' | 'deep';
  tag: string;
  isDefault?: boolean;
  isMiniRescue?: boolean;  // هل هذا روتين الإنقاذ السريع (5 دقائق)؟
}

export interface WeeklyScheduleItem {
  dayOfWeek: number; // 0 = الأحد, 1 = الاثنين, 2 = الثلاثاء, 3 = الأربعاء, 4 = الخميس, 5 = الجمعة, 6 = السبت
  dayNameAr: string;
  routineId: string | null; // null = يوم راحة
}

export interface WorkoutLog {
  id: string;
  routineId: string;
  routineName: string;
  completedAt: string; // ISO string (e.g. 2026-09-04T22:30:00Z)
  durationMinutes: number;
  exercisesCompleted: number;
  totalExercises: number;
  prePainScore?: number;  // 0 (لا يوجد ألم) إلى 10 (ألم شديد)
  postPainScore?: number; // تقييم ما بعد التمرين
  notes?: string;
}

export interface UserSettings {
  id: string; // 'current_settings'
  userName: string;
  soundBeepsEnabled: boolean;
  voiceCoachEnabled: boolean;
  voiceLanguage: 'ar' | 'en';
  defaultRestSeconds: number;
  reminderEnabled: boolean;
  reminderTime: string; // "08:30"
  reminderDays: number[]; // [0, 1, 2, 3, 4, 5, 6]
  screenWakeLock: boolean;
}
