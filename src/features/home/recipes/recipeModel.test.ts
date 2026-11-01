import { db, RoutineDatabase } from '../../../db/database';
import { exportCompleteBackup, importCompleteBackup } from '../../../db/backup';
import { BACKUP_TABLES } from '../../../db/backup';
import { SYNC_ENTITIES, syncFingerprint } from '../../../db/syncEntities';
import { cleanRecipeDraft, defaultRecipeFilters, emptyRecipe, filterRecipes, safeMediaUrl, validateRecipeRecord, type Recipe } from './recipeModel';
import { deleteRecipe, saveRecipe, toggleRecipeFavorite } from './recipeRepository';

export async function runRecipeTests() {
  const results: Array<{ name: string; passed: boolean }> = [];
  const check = (name: string, passed: boolean) => results.push({ name, passed });
  const rejects = (fn: () => unknown) => { try { fn(); return false; } catch { return true; } };
  const database = new RoutineDatabase('recipe-feature-tests');
  await database.open();
  try {
    const basic = await saveRecipe({ ...emptyRecipe(), title: ' فول بالبيض ' }, undefined, database, 'owner');
    check('Recipe name alone can be saved offline with unknown duration and servings', basic.title === 'فول بالبيض' && basic.durationMinutes === null && basic.servings === null && basic.ingredients.length === 0);
    const recipe = await saveRecipe({ ...emptyRecipe(), title: 'سندوتش فراخ', mealTypes: ['breakfast', 'dinner', 'sandwich'], ingredients: [{ name: ' فِلْفِل ألوان ', quantity: '٢ قطعة' }, { name: 'فراخ', quantity: '' }], steps: [' نتبل الفراخ ', '', 'نجهز السندوتشات'], durationMinutes: 20, imageUrl: 'https://example.com/food.jpg', videoUrl: 'https://youtu.be/example', isLight: true }, undefined, database, 'owner');
    check('Recipes retain multiple meals, structured ingredient quantities and ordered preparation', recipe.mealTypes.length === 3 && recipe.ingredients[0].quantity === '٢ قطعة' && recipe.steps.length === 2 && recipe.steps[0] === 'نتبل الفراخ');
    check('All recipes are visible without selecting a meal', filterRecipes([basic, recipe], defaultRecipeFilters).length === 2);
    check('The same recipe can appear under breakfast and dinner', filterRecipes([recipe], { ...defaultRecipeFilters, meal: 'breakfast' }).length === 1 && filterRecipes([recipe], { ...defaultRecipeFilters, meal: 'dinner' }).length === 1);
    check('Ingredient search normalizes Arabic letters and diacritics and requires all named ingredients', filterRecipes([recipe], { ...defaultRecipeFilters, ingredients: 'فلفل الوان، فراخ' }).length === 1 && filterRecipes([recipe], { ...defaultRecipeFilters, ingredients: 'فراخ، جبنة' }).length === 0);
    check('Name and notes are searchable but do not count as ingredient evidence', filterRecipes([recipe], { ...defaultRecipeFilters, query: 'سندوتش' }).length === 1 && filterRecipes([recipe], { ...defaultRecipeFilters, ingredients: 'سندوتش' }).length === 0);
    check('Quick filter excludes unknown durations and light filter is an explicit personal tag', filterRecipes([basic, recipe], { ...defaultRecipeFilters, quick: true, light: true }).length === 1);
    await toggleRecipeFavorite(recipe.id, database, 'owner');
    check('Favorite toggling preserves preparation and updates the durable offline queue', (await database.recipes.get(recipe.id))?.isFavorite === true && (await database.pendingSync.where('[userId+table+entityId]').equals(['owner', 'recipes', recipe.id]).count()) === 1);
    let stale = false;
    try { await saveRecipe({ ...recipe, title: 'Stale editor' }, recipe, database, 'owner'); } catch { stale = true; }
    check('A stale editor cannot overwrite a recipe changed in another view or device', stale && (await database.recipes.get(recipe.id))?.isFavorite === true);
    const entity = SYNC_ENTITIES.find(item => item.cloud === 'recipes')!;
    const payload = entity.toCloud('owner', basic as unknown as Record<string, unknown>);
    const restored = entity.fromCloud(payload) as unknown as Recipe;
    check('Cloud round trip preserves null optional values and complete recipe fields', restored.durationMinutes === null && restored.servings === null && syncFingerprint(payload) === syncFingerprint(entity.toCloud('owner', restored as unknown as Record<string, unknown>)));
    check('Unsafe protocols, credential URLs and disguised YouTube hosts are rejected', rejects(() => safeMediaUrl('javascript:alert(1)')) && rejects(() => safeMediaUrl('https://user:password@example.com/a.jpg')) && rejects(() => safeMediaUrl('https://youtube.com.evil.example/video', true)) && safeMediaUrl('https://www.youtube.com/watch?v=test', true).startsWith('https://'));
    check('Invalid quantities, durations, missing titles and invalid meal tags are rejected', rejects(() => cleanRecipeDraft({ ...emptyRecipe(), title: '' })) && rejects(() => cleanRecipeDraft({ ...emptyRecipe(), title: 'Food', durationMinutes: 0 })) && rejects(() => cleanRecipeDraft({ ...emptyRecipe(), title: 'Food', ingredients: [{ name: '', quantity: '2' }] })) && rejects(() => validateRecipeRecord({ ...recipe, mealTypes: ['invalid'] })));
    check('Malformed recipe backups reject non-string ingredients and invalid dates', rejects(() => validateRecipeRecord({ ...recipe, ingredients: [{ name: 42, quantity: '' }] })) && rejects(() => validateRecipeRecord({ ...recipe, createdAt: 'invalid' })));
    await deleteRecipe(basic, database, 'owner');
    check('Deleting before first sync preserves a deletion intent and baseline', !await database.recipes.get(basic.id) && (await database.pendingSync.where('[userId+table+entityId]').equals(['owner', 'recipes', basic.id]).first())?.action === 'delete' && !!await database.syncBaselines.get('recipes:' + basic.id));
    await db.recipes.put(recipe);
    const backup = await exportCompleteBackup();
    await db.recipes.delete(recipe.id);
    const imported = await importCompleteBackup(backup);
    check('Portable JSON includes and restores recipes with all details', Object.keys(JSON.parse(backup).data).length === Object.keys(BACKUP_TABLES).length && imported.success && (await db.recipes.get(recipe.id))?.videoUrl === recipe.videoUrl);
    const invalid = JSON.parse(backup); invalid.data.recipes[0].imageUrl = 'javascript:alert(1)';
    check('Unsafe recipe media in backups is rejected before changing local data', !(await importCompleteBackup(JSON.stringify(invalid))).success && (await db.recipes.get(recipe.id))?.imageUrl === recipe.imageUrl);
    await db.recipes.delete(recipe.id);
  } finally { database.close(); await database.delete(); }
  return results;
}
