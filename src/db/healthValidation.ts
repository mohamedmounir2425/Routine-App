import type { HealthRecord } from '../types/health';
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
export const validHealthDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(`${v}T12:00:00Z`).toISOString().slice(0, 10) === v;
export function validateHealthRecord(value: unknown): asserts value is HealthRecord {
  if (!object(value) || typeof value.id !== 'string' || !value.id.trim() || !object(value.data)) throw new Error('بيانات الصحة غير صالحة');
  const d = value.data;
  if (!['exercise','plan','run','occurrence','nutrition','nutritionLog','weight','execution','preferences'].includes(String(value.kind))) throw new Error('نوع بيانات الصحة غير صالح');
  if (value.kind !== 'preferences' && (d.id !== value.id || typeof d.id !== 'string')) throw new Error('معرف الصحة غير متطابق');
  const text = (key: string, required = false) => {if (typeof d[key] !== 'string' || (required && !String(d[key]).trim())) throw new Error(`حقل غير صالح: ${key}`);};
  const boolean = (key: string) => {if(typeof d[key] !== 'boolean') throw new Error(`حقل غير صالح: ${key}`);};
  for (const k of ['date','originalDate','effectiveFrom','startDate','endDate','endedOn']) if (d[k] !== undefined && !validHealthDate(d[k])) throw new Error('تاريخ غير صالح');
  if(value.kind==='exercise'){text('name',true);text('arabicName',true);if(!Array.isArray(d.instructions)||!Array.isArray(d.targetMuscles)||!Number.isFinite(d.durationSeconds)||Number(d.durationSeconds)<1||!Number.isFinite(d.restAfterSeconds)||Number(d.restAfterSeconds)<0)throw new Error('تمرين غير صالح');}
  if (value.kind === 'plan') {
    text('description'); boolean('archived'); boolean('painTracking'); text('updatedAt',true);
    if (typeof d.name !== 'string' || !d.name.trim() || !Array.isArray(d.sessions) || !d.sessions.length) throw new Error('أضف اسم الخطة وجلسة');
    const ids = new Set();
    for (const s of d.sessions) {
      if (!object(s) || typeof s.id !== 'string' || ids.has(s.id) || !Array.isArray(s.items) || (!s.items.length && d.needsReview!==true)) throw new Error('أضف تمارين الجلسة');
      ids.add(s.id); const items = new Set();
      for (const i of s.items) {
        if (!object(i) || typeof i.id !== 'string' || items.has(i.id) || typeof i.exerciseId !== 'string' || !Number.isInteger(i.sets) || Number(i.sets) < 1 || Number(i.sets)>100) throw new Error('إعداد تمرين غير صالح');
        items.add(i.id);
        for (const k of ['reps','durationSeconds','holdSeconds','restSeconds']) if (i[k] !== undefined && (!Number.isFinite(i[k]) || Number(i[k]) < (k === 'restSeconds' ? 0 : 1))) throw new Error('قيمة تمرين غير صالحة');
        if (i.reps && i.durationSeconds) throw new Error('اختر تكرارات أو مدة');
      }
    }
  }
  if (value.kind === 'run' && (!Array.isArray(d.rules) || !Array.isArray(d.pauses) || typeof d.planId !== 'string' || !validHealthDate(d.effectiveFrom))) throw new Error('جدول غير صالح');
  if (value.kind === 'run') {
    const ids = new Set();
    for (const r of d.rules as unknown[]) {
      if (!object(r) || typeof r.id !== 'string' || ids.has(r.id) || typeof r.sessionId !== 'string' || !Number.isInteger(r.day) || Number(r.day)<0 || Number(r.day)>6 || (r.time !== undefined && !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(r.time))) || (r.week !== undefined && (!Number.isInteger(r.week) || Number(r.week)<1))) throw new Error('موعد غير صالح');
      ids.add(r.id);
    }
    for (const p of d.pauses as unknown[]) if (!object(p) || !validHealthDate(p.from) || (p.until !== undefined && (!validHealthDate(p.until) || p.until < p.from))) throw new Error('فترة توقف غير صالحة');
  }
  if (value.kind === 'occurrence' && !['pending','completed','partial','skipped'].includes(String(d.status))) throw new Error('حالة جلسة غير صالحة');
  if (value.kind === 'occurrence') {for (const key of ['planId','runId','sessionId']) text(key,true);if(!validHealthDate(d.date)||!validHealthDate(d.originalDate)) throw new Error('موعد جلسة غير صالح');}
  if (value.kind === 'nutrition') {
    for (const key of ['description','text','notes','updatedAt','trackingId']) text(key,key==='trackingId');
    boolean('tracking');boolean('weightTracking');
    if (typeof d.name !== 'string' || !d.name.trim() || !['text','meals'].includes(String(d.mode)) || !Array.isArray(d.meals) || typeof d.text !== 'string' || !(d.mode === 'text' ? d.text.trim() : d.meals.length)) throw new Error('أضف اسم النظام ومحتواه');
    const ids = new Set();
    for (const m of d.meals) {
      if (!object(m) || typeof m.id !== 'string' || ids.has(m.id) || ['name','text','portion','alternatives','notes'].some(k=>typeof m[k] !== 'string') || (!String(m.text).trim() && (typeof m.recipeId!=='string'||!m.recipeId))) throw new Error('أضف نص الوجبة أو وصفة');
      ids.add(m.id);
    }
  }
  if (value.kind === 'nutritionLog' && !['yes','partial','no'].includes(String(d.status))) throw new Error('تسجيل تغذية غير صالح');
  if (value.kind === 'nutritionLog') {text('planId',true);text('trackingId',true);text('note');if(!validHealthDate(d.date)||value.id!==`nutrition-day:${d.planId}:${d.trackingId}:${d.date}`)throw new Error('تسجيل تغذية غير صالح');}
  if (value.kind === 'weight' && (!Number.isFinite(d.value) || Number(d.value)<=0 || Number(d.value)>2000 || !['kg','lb'].includes(String(d.unit)))) throw new Error('قياس غير صالح');
  if (value.kind === 'weight') {text('planId',true);if(!validHealthDate(d.date))throw new Error('قياس غير صالح');}
  if (value.kind === 'execution') {
    text('routineId',true);text('routineName');text('completedAt',true);
    if(!Number.isFinite(Date.parse(String(d.completedAt))) || !Number.isInteger(d.exercisesCompleted) || !Number.isInteger(d.totalExercises) || Number(d.exercisesCompleted)<0 || Number(d.totalExercises)<Number(d.exercisesCompleted) || !Number.isFinite(d.durationMinutes) || Number(d.durationMinutes)<0) throw new Error('تنفيذ غير صالح');
  }
  if(value.kind==='preferences' && (value.id!=='health-preferences' || (d.activeNutritionId!==undefined && typeof d.activeNutritionId!=='string')))throw new Error('تفضيلات الصحة غير صالحة');
  if (d.startDate && d.endDate && String(d.endDate)<String(d.startDate)) throw new Error('النهاية تسبق البداية');
}
