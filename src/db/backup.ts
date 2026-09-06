import { db } from './database';

export async function exportCompleteBackup(): Promise<string> {
  const [exercises, routines, logs, schedule, settings] = await Promise.all([
    db.exercises.toArray(),
    db.routines.toArray(),
    db.workoutLogs.toArray(),
    db.weeklySchedule.toArray(),
    db.settings.toArray(),
  ]);

  const backupObj = {
    version: 1,
    exportedAt: new Date().toISOString(),
    appName: 'MoveCare Routine App',
    data: {
      exercises,
      routines,
      logs,
      schedule,
      settings,
    }
  };

  return JSON.stringify(backupObj, null, 2);
}

export async function importCompleteBackup(jsonData: string): Promise<{ success: boolean; message: string }> {
  try {
    const parsed = JSON.parse(jsonData);
    if (!parsed || !parsed.data) {
      return { success: false, message: 'ملف النسخة الاحتياطية غير صالح أو تالف' };
    }

    const { routines, logs, schedule, settings } = parsed.data;

    if (routines && Array.isArray(routines)) {
      for (const r of routines) {
        await db.routines.put(r);
      }
    }

    if (logs && Array.isArray(logs)) {
      for (const l of logs) {
        await db.workoutLogs.put(l);
      }
    }

    if (schedule && Array.isArray(schedule)) {
      for (const s of schedule) {
        await db.weeklySchedule.put(s);
      }
    }

    if (settings && Array.isArray(settings) && settings.length > 0) {
      await db.settings.put(settings[0]);
    }

    return { success: true, message: 'تم استرجاع النسخة الاحتياطية بنجاح!' };
  } catch (err: any) {
    return { success: false, message: `فشل الاسترجاع: ${err.message || 'خطأ في تنسيق الملف'}` };
  }
}
