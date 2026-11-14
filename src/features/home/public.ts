// Pure storage contracts: safe for backup/database code without importing the UI.
export { validateRecipeRecord } from './recipes/recipeModel';
export type { Recipe } from './recipes/recipeModel';
export { validateInventoryRecord } from './inventory/inventoryModel';
export type { InventoryItem } from './inventory/inventoryModel';
export { isShoppingTask, isMaintenanceTask, isHomeTaskDone } from './homeTasks';
