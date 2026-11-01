import type { LifeTask, HomeProject, Routine, DayPlan, UserSettings } from '../types';
import { DEFAULT_USER_SETTINGS } from './seedData';
import { taskToCloud, taskFromCloud, projectToCloud, projectFromCloud, routineToCloud, routineFromCloud, dayPlanToCloud, dayPlanFromCloud, settingsToCloud, type CloudTask } from './cloudMappers';

export type SyncRow = Record<string, unknown>;
export interface SyncEntity {
  cloud: string;
  local: string;
  toCloud: (userId: string, value: SyncRow) => SyncRow;
  fromCloud: (value: SyncRow, local?: SyncRow) => SyncRow;
  localKey: (value: SyncRow) => string | number;
  include?: (value: SyncRow) => boolean;
}
const object = (value: object): SyncRow => value as SyncRow;
const pairs = (names: string) => names.split(' ').map(pair => pair.split(':'));
function simple(cloud: string, local: string, names: string): SyncEntity {
  const fields = pairs('id:id ' + names);
  return {
    cloud, local, localKey: value => String(value.id),
    toCloud: (userId, value) => ({ user_id: userId, ...Object.fromEntries(fields.map(([a, b]) => [b, value[a] ?? null])) }),
    fromCloud: value => Object.fromEntries(fields.map(([a, b]) => [a, value[b] ?? undefined])),
  };
}
export const SYNC_ENTITIES: SyncEntity[] = [
  {
    ...simple('recipes', 'recipes', 'title:title mealTypes:meal_types ingredients:ingredients steps:steps notes:notes imageUrl:image_url videoUrl:video_url durationMinutes:duration_minutes servings:servings isFavorite:is_favorite isLight:is_light createdAt:created_at updatedAt:updated_at'),
    fromCloud: row => ({ id: row.id, title: row.title, mealTypes: row.meal_types, ingredients: row.ingredients, steps: row.steps, notes: row.notes, imageUrl: row.image_url, videoUrl: row.video_url, durationMinutes: row.duration_minutes ?? null, servings: row.servings ?? null, isFavorite: row.is_favorite, isLight: row.is_light, createdAt: row.created_at, updatedAt: row.updated_at }),
  },
  {
    cloud: 'profiles', local: 'settings', localKey: () => 'current_settings',
    toCloud: (uid, value) => settingsToCloud(uid, value as unknown as UserSettings),
    fromCloud: (row, local) => {
      const result = { ...DEFAULT_USER_SETTINGS, ...local } as SyncRow;
      for (const [key, value] of Object.entries(row)) {
        if (key === 'id' || key === 'updated_at' || value === null || value === undefined) continue;
        const camel = key.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());
        if (camel in DEFAULT_USER_SETTINGS || camel === 'todayPreferences') result[camel] = value;
      }
      result.id = 'current_settings';
      return result;
    },
  },
  simple('workout_logs', 'workoutLogs', 'routineId:routine_id routineName:routine_name completedAt:completed_at durationMinutes:duration_minutes exercisesCompleted:exercises_completed totalExercises:total_exercises weekNumber:week_number sessionCode:session_code prePainScore:pre_pain_score postPainScore:post_pain_score difficultyRating:difficulty_rating notes:notes'),
  {
    cloud: 'custom_routines', local: 'routines', localKey: value => String(value.id), include: value => value.isCustom === true,
    toCloud: (uid, value) => routineToCloud(uid, value as unknown as Routine),
    fromCloud: row => object(routineFromCloud(row as unknown as ReturnType<typeof routineToCloud>)),
  },
  {
    ...simple('weekly_schedule', 'weeklySchedule', 'dayOfWeek:day_of_week dayNameAr:day_name_ar routineId:routine_id isRestDay:is_rest_day restReason:rest_reason sessionCode:session_code weekNumber:week_number'),
    localKey: value => Number(value.dayOfWeek ?? value.day_of_week),
    toCloud: (uid, value) => ({ ...simple('weekly_schedule', '', 'dayOfWeek:day_of_week dayNameAr:day_name_ar routineId:routine_id isRestDay:is_rest_day restReason:rest_reason sessionCode:session_code weekNumber:week_number').toCloud(uid, value), id: uid + '_day_' + value.dayOfWeek }),
  },
  simple('azkar_logs', 'azkarLogs', 'date:date categoryKey:category_key categoryArabic:category_arabic totalDhikr:total_dhikr completedDhikr:completed_dhikr isFullyCompleted:is_fully_completed durationSeconds:duration_seconds completedAt:completed_at'),
  {
    cloud: 'life_tasks', local: 'tasks', localKey: value => String(value.id),
    toCloud: (uid, value) => taskToCloud(uid, value as unknown as LifeTask),
    fromCloud: (row, local) => object(taskFromCloud(row as CloudTask, local as unknown as LifeTask | undefined)),
  },
  {
    cloud: 'projects', local: 'projects', localKey: value => String(value.id),
    toCloud: (uid, value) => projectToCloud(uid, value as unknown as HomeProject),
    fromCloud: row => object(projectFromCloud(row as unknown as ReturnType<typeof projectToCloud>)),
  },
  simple('plans', 'plans', 'title:title category:category description:description targetDate:target_date status:status color:color icon:icon createdAt:created_at updatedAt:updated_at'),
  simple('plan_milestones', 'planMilestones', 'planId:plan_id title:title order:order isCompleted:is_completed targetDate:target_date completedAt:completed_at'),
  simple('workout_schedules', 'workoutSchedules', 'dayOfWeek:day_of_week routineId:routine_id scheduledTime:scheduled_time sessionLabel:session_label durationMinutes:duration_minutes isEnabled:is_enabled'),
  {
    cloud: 'day_plans', local: 'dayPlans', localKey: value => String(value.date),
    toCloud: (uid, value) => dayPlanToCloud(uid, value as unknown as DayPlan),
    fromCloud: row => object(dayPlanFromCloud(row as unknown as ReturnType<typeof dayPlanToCloud>)),
  },
];

export function entityKey(table: string, id: string) { return table + ':' + id; }
export function syncFingerprint(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(syncFingerprint).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.entries(value)
    .filter(([key, item]) => item !== undefined && key !== 'updated_at')
    .sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => {
      const normalized = typeof item === 'string' && /(_at|At)$/.test(key) && Number.isFinite(Date.parse(item)) ? new Date(item).toISOString() : item;
      return JSON.stringify(key) + ':' + syncFingerprint(normalized);
    }).join(',') + '}';
  return JSON.stringify(value);
}
