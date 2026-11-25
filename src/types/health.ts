import type { Exercise, ExercisePrescription, WorkoutLog } from './index';

export interface SessionExercise extends ExercisePrescription { id: string }
export interface TrainingSession { id: string; name: string; items: SessionExercise[]; week?: number; legacyRoutineId?: string }
export interface TrainingPlan {
  id: string; name: string; description: string; sessions: TrainingSession[];
  painTracking: boolean; archived: boolean; needsReview?: boolean; template?: boolean; updatedAt: string;
}
export interface TrainingRule { id: string; sessionId: string; day: number; time?: string; week?: number }
export interface TrainingRun {
  id: string; planId: string; effectiveFrom: string; startDate?: string; endDate?: string;
  endedOn?: string; pauses: { from: string; until?: string }[]; rules: TrainingRule[];
  weekOffset?: number; restDays?: number[]; migrationReview?: string;
}
export interface WorkoutOccurrence {
  id: string; runId: string; planId: string; sessionId: string; originalDate: string;
  date: string; time?: string; status: 'pending' | 'completed' | 'partial' | 'skipped';
  deferred?: boolean; reason?: string;
}
export interface NutritionMeal { id: string; name: string; text: string; portion: string; alternatives: string; notes: string; recipeId?: string; recipeTitle?: string }
export interface NutritionPlan {
  id: string; name: string; description: string; mode: 'text' | 'meals'; text: string;
  meals: NutritionMeal[]; notes: string; startDate?: string; endDate?: string;
  tracking: boolean; weightTracking: boolean; trackingId: string; updatedAt: string;
}
export interface NutritionLog { id: string; planId: string; trackingId: string; date: string; status: 'yes' | 'partial' | 'no'; note: string }
export interface WeightMeasurement { id: string; planId: string; date: string; value: number; unit: 'kg' | 'lb' }
export interface HealthData {
  exercise: Exercise; plan: TrainingPlan; run: TrainingRun; occurrence: WorkoutOccurrence;
  nutrition: NutritionPlan; nutritionLog: NutritionLog; weight: WeightMeasurement;
  execution: WorkoutLog; preferences: { activeNutritionId?: string };
}
export type HealthKind = keyof HealthData;
export type HealthRecord = { [K in HealthKind]: { id: string; kind: K; data: HealthData[K] } }[HealthKind];

// A small application-composed contract. Health never imports Home's UI or storage services.
export interface NutritionRecipe { id: string; title: string; isFavorite: boolean; isLight: boolean }
export interface NutritionRecipeAdapter {
  enabled: boolean;
  list(): Promise<NutritionRecipe[]>;
  open(id: string): void;
  create(): void;
}
