import { db, type RoutineDatabase } from '../../../db/database';
import { CURRENT_WORKSPACE, workspaceGuard } from '../../../db/workspaceScope';
import { SYNC_ENTITIES, entityKey, syncFingerprint } from '../../../db/syncEntities';
import { validateHealthRecord } from '../../../db/healthValidation';
import { getLocalDateString, parseLocalDate } from '../../../utils/dateUtils';
import type { HealthData, HealthKind, HealthRecord, TrainingPlan, TrainingRun, TrainingSession, WorkoutOccurrence } from '../../../types/health';
import type { Exercise, Routine, WorkoutLog } from '../../../types';

export const localToday = () => getLocalDateString(new Date());
export const newId = () => crypto.randomUUID();
export async function healthRows<K extends HealthKind>(kind: K, database = db): Promise<HealthData[K][]> {
  return (await database.healthRecords.where('kind').equals(kind).toArray()).map(r => r.data as HealthData[K]);
}
export async function putHealth<K extends HealthKind>(kind: K, data: HealthData[K], database = db, fixedId?: string) {
  const id = fixedId ?? ('id' in data ? data.id : 'health-preferences');
  const row = { id, kind, data } as HealthRecord;
  validateHealthRecord(row);
  await database.transaction('rw', [database.healthRecords, database.pendingSync, database.syncBaselines], async () => {
    if (database === db && CURRENT_WORKSPACE !== 'guest') workspaceGuard.assertAccount(CURRENT_WORKSPACE.slice(5));
    await database.healthRecords.put(row);
    if (database !== db || CURRENT_WORKSPACE === 'guest') return;
    const uid = CURRENT_WORKSPACE.slice(5);
    const payload = SYNC_ENTITIES.find(e => e.cloud === 'health_records')!.toCloud(uid, row as unknown as Record<string, unknown>);
    const cloudId = String(payload.id);
    const key = entityKey('health_records', cloudId);
    if (!await database.syncBaselines.get(key)) await database.syncBaselines.put({ key, table: 'health_records', entityId: cloudId, localKey: id, revision: 0, deleted: false, fingerprint: syncFingerprint(payload) });
    await database.pendingSync.where('[userId+table+entityId]').equals([uid, 'health_records', cloudId]).delete();
    await database.pendingSync.add({ table: 'health_records', entityId: cloudId, userId: uid, action: 'upsert', data: payload, timestamp: new Date().toISOString(), retryCount: 0, status: 'pending' });
  });
}
export function sessionFromRoutine(r: Routine): TrainingSession {
  return { id: r.id, name: r.name, week: r.weekNumber, legacyRoutineId: r.id,
    items: r.exerciseIds.map((exerciseId, index) => {
      const p = r.prescriptions?.find(p => p.exerciseId === exerciseId);
      const c = r.customExerciseConfigs?.[exerciseId];
      return { ...p, id: `${r.id}-item-${index}`, exerciseId, sets: p?.sets ?? 1,
        reps: c?.reps ?? p?.reps, durationSeconds: c?.reps ? undefined : c?.durationSeconds ?? p?.durationSeconds,
        restSeconds: c?.restAfterSeconds ?? p?.restSeconds };
    }) };
}

/** Stable IDs preserve references, late cloud imports and repeated backup restores. Legacy tables become read-only archives. */
export async function migrateHealth(database = db, today = localToday()) {
  await database.transaction('rw', [database.healthRecords, database.routines, database.weeklySchedule, database.workoutSchedules, database.settings, database.pendingSync, database.syncBaselines], async () => {
    const routines = await database.routines.toArray();
    const legacy = routines.filter(r => r.weekNumber && r.planSessionId);
    const seeds: TrainingPlan[] = routines.filter(r => !legacy.includes(r)).map(r => ({ id: `training-${r.id}`, name: r.name, description: r.description,
      sessions: [sessionFromRoutine(r)], needsReview: !r.exerciseIds.length, archived: false, painTracking: false, template: !r.isCustom, updatedAt: new Date().toISOString() }));
    if (legacy.length) seeds.push({ id: 'training-four-week', name: 'برنامج الأربع أسابيع', description: 'قالب محفوظ؛ اختر أسابيعه أو عدله حسب نظامك.',
      sessions: legacy.sort((a,b) => (a.weekNumber ?? 0)-(b.weekNumber ?? 0)).map(sessionFromRoutine), archived: false, painTracking: false, template: true, updatedAt: new Date().toISOString() });
    const modern = await database.workoutSchedules.toArray();
    const weekly = await database.weeklySchedule.toArray();
    const find = (routineId: string) => seeds.find(p => p.sessions.some(s => s.legacyRoutineId === routineId));
    for(const routineId of new Set([...modern.map(e=>e.routineId),...weekly.flatMap(e=>e.routineId?[e.routineId]:[])])) if(!find(routineId)) seeds.push({id:'training-'+routineId,name:'خطة تحتاج مراجعة',description:'تعريف الخطة القديمة لم يعد متاحًا. أصلح محتواها من تعديل الخطة؛ موعدها محفوظ.',sessions:[{id:routineId,name:'جلسة محفوظة',legacyRoutineId:routineId,items:[]}],needsReview:true,archived:false,painTracking:false,updatedAt:new Date().toISOString()});
    for (const p of seeds) if (!await database.healthRecords.get(p.id)) await putHealth('plan', p, database);
    const settings = await database.settings.get('current_settings');
    for (const entry of [...modern.map(e => ({ id: `migrated-schedule-${e.id}`, routineId: e.routineId, day: e.dayOfWeek, time: e.scheduledTime, enabled: e.isEnabled, review: '' })),
      ...weekly.filter(e => e.routineId).map(e => ({ id: `migrated-weekly-${e.dayOfWeek}`, routineId: e.routineId!, day: e.dayOfWeek, time: '', enabled: true,
        review: modern.some(m => m.dayOfWeek === e.dayOfWeek && m.routineId === e.routineId) ? 'موعد من الجدول القديم يشبه موعدًا آخر. احتفظنا بالاثنين؛ راجعهما واختر الجدول المطلوب.' : '' }))]) {
      if (await database.healthRecords.get(entry.id)) continue;
      const plan = find(entry.routineId); if (!plan) continue;
      const session = plan.sessions.find(s => s.legacyRoutineId === entry.routineId)!;
      await putHealth('run', { id: entry.id, planId: plan.id, effectiveFrom: today,
        // The old starting date is unknown; do not invent it or attach old logs to a new run.
        weekOffset: (settings?.currentWeekNumber ?? 1)-1, pauses: entry.enabled ? [] : [{ from: today }],
        restDays: weekly.filter(d => d.isRestDay === true).map(d => d.dayOfWeek), migrationReview: entry.review,
        rules: [{ id: entry.id, sessionId: session.id, day: entry.day, time: entry.time || undefined }] }, database);
    }
  });
}

export function occurrencesForDate(plan: TrainingPlan, run: TrainingRun, date: string): WorkoutOccurrence[] {
  if (date < run.effectiveFrom || (run.startDate && date < run.startDate) || (run.endDate && date > run.endDate) || (run.endedOn && date >= run.endedOn) || run.pauses.some(p => date >= p.from && (!p.until || date < p.until))) return [];
  const day = parseLocalDate(date).getDay();
  const elapsedDays = Math.round((Date.parse(`${date}T12:00:00Z`)-Date.parse(`${run.startDate ?? run.effectiveFrom}T12:00:00Z`))/86400000);
  const week = Math.floor(elapsedDays / 7) + 1 + (run.weekOffset ?? 0);
  return run.rules.filter(r => r.day === day && (!r.week || r.week === week)).map(r => ({
    id: `occ:${run.id}:${r.id}:${date}`, runId: run.id, planId: plan.id, sessionId: r.sessionId, originalDate: date, date, time: r.time, status: 'pending',
  }));
}
export function isWorkoutAvailable(o: WorkoutOccurrence, run?: TrainingRun, plan?: TrainingPlan) {
  return !!run && !!plan && !plan.archived && (o.status==='pending'||o.status==='partial')
    && (!run.endedOn || o.date<run.endedOn) && (!run.endDate || o.date<=run.endDate)
    && !run.pauses.some(p=>o.date>=p.from&&(!p.until||o.date<p.until));
}
export async function getWorkoutOccurrences(date = localToday(), database = db) {
  await migrateHealth(database);
  const [plans, runs, changes] = await Promise.all([healthRows('plan', database), healthRows('run', database), healthRows('occurrence', database)]);
  const generated = plans.flatMap(p => runs.filter(r => r.planId === p.id).flatMap(r => occurrencesForDate(p,r,date)));
  const visibleChanges = changes.filter(c=>{if(c.status==='completed'||c.status==='partial'||c.status==='skipped')return true;const r=runs.find(r=>r.id===c.runId);return r&&(!r.endedOn||date<r.endedOn)&&!r.pauses.some(p=>date>=p.from&&(!p.until||date<p.until));});
  const byId = new Map(visibleChanges.map(c => [c.id,c]));
  const merged = generated.map(c => byId.get(c.id) ?? c).filter(c => c.date === date);
  for (const change of visibleChanges) if (change.date === date && !merged.some(c => c.id === change.id)) merged.push(change);
  return merged.sort((a,b) => (a.time ?? '').localeCompare(b.time ?? ''));
}
export async function startTrainingRun(plan: TrainingPlan, rules: TrainingRun['rules'], startDate = localToday(), endDate?: string, database = db, restDays?: number[]) {
  const cleanEnd = endDate?.trim() || undefined;
  if (cleanEnd && cleanEnd < startDate) throw new Error('النهاية تسبق البداية');
  if (!rules.length || rules.some(r => !plan.sessions.some(s => s.id === r.sessionId))) throw new Error('اختر جلسة وموعدًا');
  const run: TrainingRun = {
    id: newId(),
    planId: plan.id,
    rules,
    startDate,
    effectiveFrom: startDate,
    endDate: cleanEnd,
    restDays: restDays?.length ? restDays : undefined,
    pauses: [],
  };
  if (cleanEnd) {
    const cursor = parseLocalDate(startDate);
    let hasSession = false;
    for (let i = 0; i < 3700 && getLocalDateString(cursor) <= cleanEnd; i++) {
      if (occurrencesForDate(plan, run, getLocalDateString(cursor)).length > 0) {
        hasSession = true;
        break;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    if (!hasSession) throw new Error('لا توجد جلسات ضمن المدة المحددة');
  }
  await database.transaction('rw', [database.healthRecords,database.pendingSync,database.syncBaselines], async () => {
    for (const old of (await healthRows('run',database)).filter(r => r.planId === plan.id && !r.endedOn)) await putHealth('run', { ...old, endedOn: startDate },database);
    await putHealth('run',run,database);
  });
  return run;
}
export async function pauseTraining(run: TrainingRun, date = localToday(), database = db) {
  const paused = run.pauses.some(p => !p.until);
  const nextPauses = paused
    ? run.pauses.flatMap(p => {
        if (p.until) return [p];
        if (date <= p.from) return [];
        return [{ ...p, until: date }];
      })
    : [...run.pauses, { from: date }];
  await putHealth('run', { ...run, pauses: nextPauses }, database);
}
export async function changeOccurrence(occurrence: WorkoutOccurrence, change: { date?: string; skip?: boolean; reason?: string }, database = db) {
  const run = await database.healthRecords.get(occurrence.runId);
  if(change.date && run?.kind==='run' && run.data.endDate && change.date>run.data.endDate)throw new Error('التاريخ خارج مدة الخطة. اختر موعدًا قبل النهاية.');
  const current = await database.healthRecords.get(occurrence.id);
  const latest = current?.kind === 'occurrence' ? current.data : occurrence;
  if (latest.status === 'completed') throw new Error('الجلسة مكتملة بالفعل');
  await putHealth('occurrence', { ...latest, date: change.date ?? latest.date, deferred: !!change.date || latest.deferred,
    status: change.skip ? 'skipped' : 'pending', reason: change.reason },database);
}
export function routineForSession(plan: TrainingPlan, session: TrainingSession, occurrence?: WorkoutOccurrence): Routine {
  // Unique playback IDs let the existing player address repeated exercises independently.
  return { id: session.legacyRoutineId ?? session.id, name: `${plan.name} · ${session.name}`, description: plan.description,
    exerciseIds: session.items.map(i => i.id), prescriptions: session.items.map(i => ({ ...i, exerciseId: i.id })),
    totalEstimatedMinutes: Math.max(1,Math.ceil(session.items.reduce((n,i) => n+i.sets*((i.durationSeconds ?? i.holdSeconds ?? (i.reps ? i.reps*3 : 60))+(i.restSeconds ?? 15)),0)/60)),
    level: 'gentle', tag: 'خطة', trainingPlanId: plan.id, trainingRunId: occurrence?.runId, occurrenceId: occurrence?.id,
    painTracking: plan.painTracking, planSessionId: session.id };
}
export function playbackForSession(session: TrainingSession, library: Exercise[]) {
  const missing = session.items.filter(i => !library.some(e => e.id === i.exerciseId));
  const exercises = session.items.flatMap(i => {
    const e = library.find(e => e.id === i.exerciseId); if (!e) return [];
    return [{ ...e, sourceExerciseId: e.id, id: i.id, durationSeconds: i.durationSeconds ?? i.holdSeconds ?? e.durationSeconds, reps: i.reps, restAfterSeconds: i.restSeconds ?? e.restAfterSeconds }];
  });
  return { missing, exercises };
}
export async function recordTrainingExecution(log: WorkoutLog, occurrence?: WorkoutOccurrence, database = db) {
  await database.transaction('rw', [database.healthRecords,database.workoutLogs,database.pendingSync,database.syncBaselines], async () => {
    if (await database.workoutLogs.get(log.id)) throw new Error('تم حفظ هذه الجلسة من قبل');
    if (occurrence) {
      const previous = await database.healthRecords.get(occurrence.id);
      if (previous?.kind === 'occurrence' && previous.data.status === 'completed') throw new Error('تم حفظ هذه الجلسة من قبل');
      const baseOccurrence = previous?.kind === 'occurrence' ? previous.data : occurrence;
      const nextStatus =
        log.exercisesCompleted <= 0
          ? baseOccurrence.status
          : log.exercisesCompleted >= log.totalExercises
            ? 'completed'
            : 'partial';
      await putHealth('occurrence', { ...baseOccurrence, status: nextStatus }, database);
    }
    await database.workoutLogs.put(log);
    await putHealth('execution',log,database);
  });
}
export function adherence(occurrences: WorkoutOccurrence[]) {
  return { planned: occurrences.length, completed: occurrences.filter(o => o.status === 'completed').length,
    partial: occurrences.filter(o => o.status === 'partial').length, skipped: occurrences.filter(o => o.status === 'skipped').length };
}
export async function archiveTraining(plan: TrainingPlan, database: RoutineDatabase = db) {
  await database.transaction('rw',[database.healthRecords,database.pendingSync,database.syncBaselines],async()=>{
    if (!plan.archived) for(const run of (await healthRows('run',database)).filter(r=>r.planId===plan.id&&!r.endedOn)) await putHealth('run',{...run,endedOn:localToday()},database);
    await putHealth('plan', { ...plan, archived: !plan.archived, updatedAt: new Date().toISOString() },database);
  });
}
