export const MEAL_TYPES = [
  { id: 'breakfast', label: 'الإفطار', icon: '🍳' },
  { id: 'lunch', label: 'الغداء', icon: '🍲' },
  { id: 'dinner', label: 'العشاء', icon: '🥗' },
  { id: 'snack', label: 'الوجبات الخفيفة', icon: '🍿' },
  { id: 'sandwich', label: 'السندويشات', icon: '🥪' },
] as const;
export type MealType = typeof MEAL_TYPES[number]['id'];
export interface RecipeIngredient { name: string; quantity: string }
export interface Recipe {
  id: string;
  title: string;
  mealTypes: MealType[];
  ingredients: RecipeIngredient[];
  steps: string[];
  notes: string;
  imageUrl: string;
  videoUrl: string;
  durationMinutes: number | null;
  servings: number | null;
  isFavorite: boolean;
  isLight: boolean;
  createdAt: string;
  updatedAt: string;
}
export type RecipeDraft = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>;
export const emptyRecipe = (): RecipeDraft => ({ title: '', mealTypes: [], ingredients: [], steps: [], notes: '', imageUrl: '', videoUrl: '', durationMinutes: null, servings: null, isFavorite: false, isLight: false });

export function normalizeFoodText(value: string) {
  return value.normalize('NFKC').toLowerCase().replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/\s+/g, ' ').trim();
}
export function safeMediaUrl(value: string, video = false): string {
  if (!value.trim()) return '';
  try {
    const url = new URL(value.trim());
    if (value.trim().length > 2048 || url.protocol !== 'https:' || url.username || url.password) throw new Error();
    if (video && !['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(url.hostname.toLowerCase())) throw new Error();
    return url.href;
  } catch { throw new Error(video ? 'اكتب رابط فيديو YouTube صحيح يبدأ بـ https://' : 'اكتب رابط صورة صحيح يبدأ بـ https://'); }
}
export function cleanRecipeDraft(draft: RecipeDraft): RecipeDraft {
  const title = draft.title.trim();
  if (!title || title.length > 160) throw new Error('اسم الأكلة مطلوب، بحد أقصى ١٦٠ حرف.');
  if (draft.mealTypes.some(type => !MEAL_TYPES.some(item => item.id === type))) throw new Error('تصنيف الوجبة غير صحيح.');
  if (draft.ingredients.length > 100 || draft.steps.length > 100) throw new Error('الحد الأقصى ١٠٠ مكون و١٠٠ خطوة.');
  if (draft.ingredients.some(item => !item.name.trim() && item.quantity.trim())) throw new Error('اكتب اسم المكون بجانب كميته.');
  if (draft.ingredients.some(item => item.name.length > 160 || item.quantity.length > 120) || draft.steps.some(step => step.length > 4000) || draft.notes.length > 8000) throw new Error('التفاصيل أطول من الحد المسموح.');
  for (const [value, max] of [[draft.durationMinutes, 1440], [draft.servings, 100]] as const) if (value !== null && (!Number.isInteger(value) || value < 1 || value > max)) throw new Error('راجع المدة وعدد الأفراد؛ استخدم أرقامًا صحيحة موجبة.');
  return { ...draft, title, mealTypes: [...new Set(draft.mealTypes)], ingredients: draft.ingredients.filter(item => item.name.trim()).map(item => ({ name: item.name.trim(), quantity: item.quantity.trim() })), steps: draft.steps.map(step => step.trim()).filter(Boolean), notes: draft.notes.trim(), imageUrl: safeMediaUrl(draft.imageUrl), videoUrl: safeMediaUrl(draft.videoUrl, true) };
}
export function validateRecipeRecord(value: unknown): asserts value is Recipe {
  if (!value || typeof value !== 'object') throw new Error('بيانات الأكلة غير صحيحة.');
  const row = value as Record<string, unknown>;
  if (typeof row.id !== 'string' || !row.id.trim() || row.id.length > 512 || typeof row.title !== 'string' || !Array.isArray(row.mealTypes) || row.mealTypes.some(v => typeof v !== 'string') || !Array.isArray(row.ingredients) || row.ingredients.some(v => !v || typeof v !== 'object' || typeof v.name !== 'string' || typeof v.quantity !== 'string') || !Array.isArray(row.steps) || row.steps.some(v => typeof v !== 'string') || typeof row.notes !== 'string' || typeof row.imageUrl !== 'string' || typeof row.videoUrl !== 'string' || typeof row.isFavorite !== 'boolean' || typeof row.isLight !== 'boolean' || !['createdAt', 'updatedAt'].every(key => typeof row[key] === 'string' && Number.isFinite(Date.parse(row[key] as string)))) throw new Error('بيانات الأكلة غير مكتملة أو غير صحيحة.');
  cleanRecipeDraft(value as Recipe);
}
export interface RecipeFilters { meal: MealType | 'all'; query: string; ingredients: string; favorites: boolean; light: boolean; quick: boolean; sort: 'recent' | 'title' | 'duration' }
export const defaultRecipeFilters: RecipeFilters = { meal: 'all', query: '', ingredients: '', favorites: false, light: false, quick: false, sort: 'recent' };
export function filterRecipes(recipes: Recipe[], filter: RecipeFilters): Recipe[] {
  const query = normalizeFoodText(filter.query);
  const wanted = filter.ingredients.split(/[,،\n]+/).map(normalizeFoodText).filter(Boolean);
  return recipes.filter(recipe => (filter.meal === 'all' || recipe.mealTypes.includes(filter.meal))
    && (!filter.favorites || recipe.isFavorite) && (!filter.light || recipe.isLight)
    && (!filter.quick || recipe.durationMinutes !== null && recipe.durationMinutes <= 30)
    && (!query || normalizeFoodText([recipe.title, recipe.notes, ...recipe.ingredients.map(item => item.name)].join(' ')).includes(query))
    && wanted.every(term => recipe.ingredients.some(item => normalizeFoodText(item.name).includes(term))))
    .sort((a, b) => filter.sort === 'title' ? a.title.localeCompare(b.title, 'ar') : filter.sort === 'duration' ? (a.durationMinutes ?? Infinity) - (b.durationMinutes ?? Infinity) || a.title.localeCompare(b.title, 'ar') : b.updatedAt.localeCompare(a.updatedAt) || a.title.localeCompare(b.title, 'ar'));
}
