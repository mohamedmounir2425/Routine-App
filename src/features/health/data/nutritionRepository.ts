import { db } from '../../../db/database';
import type { NutritionPlan, NutritionLog, WeightMeasurement } from '../../../types/health';
import { healthRows, localToday, newId, putHealth } from './trainingRepository';

export function emptyNutrition(): NutritionPlan {
  return { id: newId(), name: '', description: '', mode: 'text', text: '', meals: [], notes: '', tracking: false, weightTracking: false, trackingId: newId(), updatedAt: new Date().toISOString() };
}
export async function saveNutrition(plan: NutritionPlan, database = db) {
  const cleanName = plan.name.trim();
  if (!cleanName) throw new Error('أضف اسم النظام الغذائي');
  const cleanText = plan.text.trim();
  const cleanMeals = plan.meals.map(m => ({
    ...m,
    name: m.name.trim() || 'وجبة',
    text: m.text.trim(),
    portion: m.portion.trim(),
    alternatives: m.alternatives.trim(),
    notes: m.notes.trim(),
  }));
  if (plan.mode === 'text' && !cleanText) {
    throw new Error('اكتب محتوى النظام الغذائي قبل الحفظ');
  }
  if (plan.mode === 'meals') {
    if (!cleanMeals.length) throw new Error('أضف وجبة واحدة على الأقل');
    if (cleanMeals.some(m => !m.text && !m.recipeId)) {
      throw new Error('أضف نص الوجبة أو اربطها بوصفة لكل وجبة');
    }
  }
  await putHealth(
    'nutrition',
    {
      ...plan,
      name: cleanName,
      description: plan.description.trim(),
      text: cleanText,
      notes: plan.notes.trim(),
      meals: plan.mode === 'text' ? cleanMeals.filter(m => m.text || m.recipeId) : cleanMeals,
      updatedAt: new Date().toISOString(),
    },
    database
  );
}
export async function activateNutrition(planId: string, database = db) {
  if (!(await healthRows('nutrition', database)).some(p => p.id === planId)) throw new Error('النظام لم يعد متاحًا');
  await putHealth('preferences', { activeNutritionId: planId }, database);
}
export async function activeNutrition(database = db) {
  const prefs = (await healthRows('preferences',database))[0];
  return (await healthRows('nutrition',database)).find(p => p.id === prefs?.activeNutritionId);
}
export async function logNutrition(plan: NutritionPlan, status: NutritionLog['status'], note = '', date = localToday(), database = db) {
  if((plan.startDate&&date<plan.startDate)||(plan.endDate&&date>plan.endDate))throw new Error('التاريخ خارج مدة النظام. عدّل المدة لتسجيله.');
  if (!plan.tracking) throw new Error('متابعة التغذية غير مفعلة');
  const log: NutritionLog = { id: `nutrition-day:${plan.id}:${plan.trackingId}:${date}`, planId: plan.id, trackingId: plan.trackingId, date, status, note };
  await putHealth('nutritionLog',log,database); return log;
}
export async function saveWeight(measurement: Omit<WeightMeasurement,'id'>, database = db) {
  await putHealth('weight',{ ...measurement,id: newId() },database);
}
