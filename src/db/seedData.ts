import { Exercise } from '../types';
import { CORE_EXERCISES } from './seeds/coreExercises';
import { BACK_EXERCISES } from './seeds/backExercises';
import { MOBILITY_EXERCISES } from './seeds/mobilityExercises';

export { BACK_SAFETY_TIPS, INITIAL_WEEKLY_SCHEDULE, DEFAULT_USER_SETTINGS } from './seeds/tipsAndDefaults';
export type { BackSafetyTip } from './seeds/tipsAndDefaults';
export { INITIAL_ROUTINES } from './seeds/routines';
export { FOUR_WEEK_PLAN } from './seeds/fourWeekPlan';
export { FOUNDATION_LEVELS_PLAN, ALL_PLAN_ROUTINES } from './seeds/foundationLevels';

export const INITIAL_EXERCISES: Exercise[] = [
  ...CORE_EXERCISES,
  ...BACK_EXERCISES,
  ...MOBILITY_EXERCISES,
];
