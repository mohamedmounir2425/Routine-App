import { createContext, useContext } from 'react';
import type { NutritionRecipeAdapter } from '../../../types/health';
export const NutritionRecipeContext = createContext<NutritionRecipeAdapter>({enabled:false,list:async()=>[],open:()=>{},create:()=>{}});
export const useNutritionRecipes = () => useContext(NutritionRecipeContext);
