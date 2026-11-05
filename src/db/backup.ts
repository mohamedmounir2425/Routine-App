import { workspaceStorage, workspaceStorageEntries, CURRENT_WORKSPACE } from './workspaceScope';
import { db } from './database';
import { SYNC_ENTITIES, entityKey, syncFingerprint } from './syncEntities';
import { validateRecipeRecord } from '../features/home/recipes/recipeModel';
import { validateInventoryRecord } from '../features/home/inventory/inventoryModel';

// Authentication tokens and the device/account-specific sync queue are never portable data.
export const BACKUP_TABLES = {
  exercises: 'exercises', routines: 'routines', logs: 'workoutLogs', schedule: 'weeklySchedule',
  settings: 'settings', azkarLogs: 'azkarLogs', tasks: 'tasks', projects: 'projects',
  plans: 'plans', planMilestones: 'planMilestones', workoutSchedules: 'workoutSchedules',
  dayPlans: 'dayPlans', recipes: 'recipes', inventoryItems: 'inventoryItems',
} as const;

export const isPortableKey = (key: string) => /^(routine_(prayers_\d{4}-\d{2}-\d{2}(_nawafil)?|quran_.*|tasbeeh_.*|prayer_(city|coords)|today_preferences|app_lang)|life_focus_sessions|movecare_theme|azkar_(auto_advance|continuous_autoscroll|cycle_muawwidhat|focus_mode|companion_dhikr|tahlil_count|include_istighfar|session_theme))$/.test(key);
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

export async function exportCompleteBackup(): Promise<string> {
  const data: Record<string, unknown> = {};
  await db.transaction('r', Object.values(BACKUP_TABLES).map(name => db.table(name)), async () => {
    for (const [key, name] of Object.entries(BACKUP_TABLES)) data[key] = await db.table(name).toArray();
  });
  const localData: Record<string, string> = {};
  for (const [key, value] of workspaceStorageEntries()) {
    if (isPortableKey(key)) localData[key] = value;
  }
  return JSON.stringify({ version: 3, workspace: CURRENT_WORKSPACE, exportedAt: new Date().toISOString(), appName: 'MoveCare Routine App', data, localData }, null, 2);
}

function validateRecord(key: string, record: unknown): asserts record is Record<string, unknown> {
  if (key === 'inventoryItems') validateInventoryRecord(record);
  if (key === 'recipes') validateRecipeRecord(record);
  if (!isObject(record)) throw new Error(`Invalid ${key} record`);
  if (key === 'dayPlans') {
    if (typeof record.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(record.date) || !Number.isFinite(record.availableMinutes) || Number(record.availableMinutes) < 0 || Number(record.availableMinutes) > 1440 || !Array.isArray(record.essentialTaskIds) || record.essentialTaskIds.some(id => typeof id !== 'string') || typeof record.endTime !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(record.endTime)) throw new Error('Invalid day plan');
  } else if (key === 'schedule') {
    if (!Number.isInteger(record.dayOfWeek) || Number(record.dayOfWeek) < 0 || Number(record.dayOfWeek) > 6) throw new Error('Invalid schedule day');
  } else if (typeof record.id !== 'string' || !record.id.trim()) throw new Error(`Missing ${key} ID`);
  const requireString = (field: string) => { if (typeof record[field] !== 'string') throw new Error(`Invalid ${key}.${field}`); };
  if (key === 'exercises') {
    requireString('name'); requireString('arabicName');
    if (!Array.isArray(record.instructions) || !Array.isArray(record.targetMuscles) || !Number.isFinite(record.durationSeconds)) throw new Error('Invalid exercise');
  }
  if (key === 'routines' && (!Array.isArray(record.exerciseIds) || typeof record.name !== 'string')) throw new Error('Invalid routine');
  if (key === 'tasks') {
    requireString('title');
    if (!['worship', 'health', 'work', 'home', 'plans'].includes(String(record.spaceId)) || typeof record.isCompleted !== 'boolean') throw new Error('Invalid task');
    if (record.deadlineAt !== undefined && (typeof record.deadlineAt !== 'string' || !Number.isFinite(new Date(record.deadlineAt).getTime()))) throw new Error('Invalid task deadline');
    if (record.commitment !== undefined && !['must', 'should', 'could'].includes(String(record.commitment))) throw new Error('Invalid commitment');
    if (record.dependsOnTaskIds !== undefined && (!Array.isArray(record.dependsOnTaskIds) || record.dependsOnTaskIds.some(id => typeof id !== 'string'))) throw new Error('Invalid task dependencies');
  }
  if (key === 'projects' || key === 'plans' || key === 'planMilestones') requireString('title');
  if (key === 'projects' && !Array.isArray(record.steps)) throw new Error('Invalid project steps');
  if (key === 'logs') { requireString('completedAt'); requireString('routineId'); }
  if (key === 'settings' && record.id !== 'current_settings') throw new Error('Invalid settings ID');
}

export type BackupConflictMode = 'keep-existing' | 'use-file';
export const SAFETY_BACKUP_KEY = 'lifeos_pre_import_backup';
function parseBackup(jsonData: string) {
  const parsed: unknown = JSON.parse(jsonData);
  if (!isObject(parsed) || !isObject(parsed.data) || ![1, 2, 3].includes(Number(parsed.version))) throw new Error('Unsupported backup format');
  const data = parsed.data;
  const entries: Array<[string, Record<string, unknown>[]]> = [];
  for (const [key, name] of Object.entries(BACKUP_TABLES)) {
    if (!(key in data)) continue; // Legacy v1 backups contain only the original tables.
    const records = data[key];
    if (!Array.isArray(records)) throw new Error(`Invalid ${key} dataset`);
    const seen = new Set<unknown>();
    for (const record of records) {
      validateRecord(key, record);
      const id = key === 'schedule' ? record.dayOfWeek : key === 'dayPlans' ? record.date : record.id;
      if (seen.has(id)) throw new Error(`Duplicate ${key} ID`);
      seen.add(id);
    }
    entries.push([name, records]);
  }
  if (!entries.length) throw new Error('Backup contains no supported datasets');
  const localEntries: Array<[string, string]> = [];
  if (parsed.localData !== undefined) {
    if (!isObject(parsed.localData)) throw new Error('Invalid local data');
    for (const [key, value] of Object.entries(parsed.localData)) {
      if (!isPortableKey(key) || typeof value !== 'string') throw new Error('Invalid local data entry');
      localEntries.push([key, value]);

    }
  }

  return { parsed, entries, localEntries };
}
export async function previewBackup(jsonData: string) {
  const { parsed, entries, localEntries } = parseBackup(jsonData);
  const tables = await Promise.all(entries.map(async ([name, records]) => {
    const table = db.table(name);
    const keys = records.map(record => record[name === 'weeklySchedule' ? 'dayOfWeek' : name === 'dayPlans' ? 'date' : 'id']);
    const existing = await table.bulkGet(keys as string[]);
    const conflicts = records.filter((record, i) => existing[i] !== undefined && JSON.stringify(existing[i]) !== JSON.stringify(record)).length;
    return { name, total: records.length, added: existing.filter(record => record === undefined).length, conflicts };
  }));
  const preferenceConflicts = localEntries.filter(([key, value]) => workspaceStorage.getItem(key) !== null && workspaceStorage.getItem(key) !== value).length;
  const sourceWorkspace = typeof parsed.workspace === 'string' && /^(guest|user:[a-zA-Z0-9-]{1,128})$/.test(parsed.workspace) ? parsed.workspace : null;
  return { version: Number(parsed.version), sourceWorkspace, exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : null, tables, preferenceConflicts };
}

export async function importCompleteBackup(jsonData: string, conflictMode: BackupConflictMode = 'use-file'): Promise<{ success: boolean; message: string }> {
  const previousLocalData = new Map<string, string | null>();
  let localDataWritten = false;
  try {
    const { entries, localEntries } = parseBackup(jsonData);
    // Fail safely if the device cannot persist the recovery snapshot.
    workspaceStorage.setItem(SAFETY_BACKUP_KEY, await exportCompleteBackup());
    for (const [key] of localEntries) previousLocalData.set(key, workspaceStorage.getItem(key));
    // Merge valid records atomically. An invalid/write-failing file cannot partially restore Dexie tables.
    await db.transaction('rw', [...entries.map(([name]) => db.table(name)), db.syncBaselines], async () => {
      for (const [name, records] of entries) {
        const table = db.table(name);
        const keys = records.map(record => record[name === 'weeklySchedule' ? 'dayOfWeek' : name === 'dayPlans' ? 'date' : 'id']);
        const existing = conflictMode === 'keep-existing' ? await table.bulkGet(keys as string[]) : [];
        const selected = conflictMode === 'use-file' ? records : records.filter((_, index) => existing[index] === undefined);
        if (selected.length) await table.bulkPut(selected);
        // Imported IDs may already exist on another device. Retain an unversioned
        // baseline so an offline delete before first sync cannot be resurrected.
        const entity = SYNC_ENTITIES.find(item => item.local === name);
        if (entity && CURRENT_WORKSPACE !== 'guest') for (const record of selected) {
          if (entity.include && !entity.include(record)) continue;
          const payload = entity.toCloud(CURRENT_WORKSPACE.slice(5), record);
          const key = entityKey(entity.cloud, String(payload.id));
          if (!await db.syncBaselines.get(key)) await db.syncBaselines.put({ key, table: entity.cloud,
            entityId: String(payload.id), localKey: entity.localKey(record), revision: 0, deleted: false,
            fingerprint: syncFingerprint(payload) });
        }
      }
      localDataWritten = true;
      for (const [key, value] of localEntries) {
        if (conflictMode === 'use-file' || workspaceStorage.getItem(key) === null) workspaceStorage.setItem(key, value);
      }
    });
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('storage'));
    return { success: true, message: 'تم استرجاع النسخة الاحتياطية بنجاح!' };
  } catch (error: unknown) {
    if (localDataWritten) {
      for (const [key, value] of previousLocalData) {
        try { if (value === null) workspaceStorage.removeItem(key); else workspaceStorage.setItem(key, value); }
        catch (restoreError) { console.error('Could not roll back local storage:', restoreError); }
      }
    }
    return { success: false, message: `فشل الاسترجاع: ${error instanceof Error ? error.message : 'خطأ في تنسيق الملف'}` };
  }
}
