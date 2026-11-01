import { db, getUserSettings } from '../../db/database';
import { saveTask, syncTaskInBackground } from '../../db/taskQueries';
import { LIFE_SPACES_CONFIG } from '../../config/spacesConfig';
import { LifeTask, LifeSpaceId } from '../../types';
import { parseLocalDate } from '../../utils/dateUtils';
import { DEFAULT_TODAY_PREFERENCES, TodayPreferences, UserSettings } from '../../types';
import { saveTodayPreferences } from './todayPreferencesService';
export { isSpaceTaskDue } from './taskCalendar';

export function settingsForVisibleTask(settings: UserSettings, task: LifeTask): UserSettings {
  const prefs: TodayPreferences = { ...DEFAULT_TODAY_PREFERENCES, ...settings.todayPreferences };
  const keys = { worship: 'showWorship', health: 'showHealth', work: 'showWork', home: 'showHome', plans: 'showPlans' } as const;
  prefs[keys[task.spaceId]] = true;
  if (task.spaceId === 'work') prefs.workOptions = { ...prefs.workOptions, top3Only: false };
  if (task.spaceId === 'home') prefs.homeOptions = { ...prefs.homeOptions, ...(task.isRecurring ? { routines: true } : { nextActionsOnly: false }) };
  if (task.spaceId === 'plans') prefs.plansOptions = { ...prefs.plansOptions, showDailyActions: true };
  const enabled = settings.enabledSpaces || LIFE_SPACES_CONFIG.filter(space => space.defaultEnabled).map(space => space.id);
  return { ...settings, enabledSpaces: [...new Set([...enabled, task.spaceId])], todayPreferences: prefs };
}

export async function saveEnabledSpaces(ids: LifeSpaceId[]): Promise<TodayPreferences> {
  const known = LIFE_SPACES_CONFIG.map(space => space.id);
  const enabled = [...new Set(ids)].filter(id => known.includes(id));
  if (!enabled.length) throw new Error('اختار مساحة واحدة على الأقل.');
  const prefs = await db.transaction('rw', db.settings, async () => {
    const settings = await getUserSettings();
    const updated = { ...DEFAULT_TODAY_PREFERENCES, ...settings.todayPreferences,
      showWorship: enabled.includes('worship'), showHealth: enabled.includes('health'), showWork: enabled.includes('work'), showHome: enabled.includes('home'), showPlans: enabled.includes('plans') };
    await db.settings.put({ ...settings, enabledSpaces: enabled, todayPreferences: updated });
    return updated;
  });
  saveTodayPreferences(prefs);
  return prefs;
}

export async function saveSpaceTask(task: LifeTask, options?: { revealInToday?: boolean }): Promise<LifeTask> {
  if (!LIFE_SPACES_CONFIG.some(space => space.id === task.spaceId)) throw new Error('اختر مساحة صحيحة للمهمة.');
  if (!task.title.trim()) throw new Error('اكتب عنوان المهمة.');
  if (task.estimatedMinutes !== undefined && (!Number.isFinite(task.estimatedMinutes) || task.estimatedMinutes < 1 || task.estimatedMinutes > 1440)) throw new Error('المدة لازم تكون بين دقيقة و١٤٤٠ دقيقة.');
  if (task.dueDate && (!/^\d{4}-\d{2}-\d{2}$/.test(task.dueDate) || `${parseLocalDate(task.dueDate).getFullYear()}-${String(parseLocalDate(task.dueDate).getMonth() + 1).padStart(2, '0')}-${String(parseLocalDate(task.dueDate).getDate()).padStart(2, '0')}` !== task.dueDate)) throw new Error('اختار تاريخ صحيح.');
  if (task.scheduledTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(task.scheduledTime)) throw new Error('اختار وقت صحيح.');
  if (task.deadlineAt && !Number.isFinite(new Date(task.deadlineAt).getTime())) throw new Error('موعد التسليم غير صحيح.');
  if (task.planId && !await db.plans.get(task.planId)) throw new Error('الخطة المرتبطة لم تعد موجودة.');
  if (task.projectId) {
    const project = await db.projects.get(task.projectId);
    if (!project || (project.spaceId || 'home') !== task.spaceId) throw new Error('اختار مشروع تابع لنفس مساحة المهمة.');
  }
  const tasks = new Map((await db.tasks.toArray()).map(item => [item.id, item]));
  const visited = new Set<string>();
  const reachesSelf = (id: string): boolean => {
    if (id === task.id) return true;
    if (visited.has(id)) return false;
    visited.add(id);
    return (tasks.get(id)?.dependsOnTaskIds || []).some(reachesSelf);
  };
  if ((task.dependsOnTaskIds || []).some(reachesSelf)) throw new Error('المهام مرتبطة في دائرة؛ عدّل المهام السابقة أولاً.');
  const updated = { ...task, title: task.title.trim(), sourceType: task.sourceType || 'manual' as const };
  let updatedSettings: UserSettings | undefined;
  await db.transaction('rw', [db.tasks, db.settings], async () => {
    await saveTask(updated, { localOnly: true });
    if (options?.revealInToday) {
      updatedSettings = settingsForVisibleTask(await getUserSettings(), updated);
      await db.settings.put(updatedSettings);
    }
  });
  syncTaskInBackground((await db.tasks.get(updated.id)) || updated);
  if (updatedSettings?.todayPreferences) saveTodayPreferences(updatedSettings.todayPreferences);
  return updated;
}
