import { randomUUID } from 'crypto';
import { Recipe, CreateRecipeInput, UpdateRecipeInput } from '../schemas/recipe.schema';

export interface RecipeFilters {
  difficulty?: string;
  cuisine?: string;
  maxCookingTime?: number;
  search?: string;
}

const store = new Map<string, Recipe>();

export function getAllRecipes(filters?: RecipeFilters): Recipe[] {
  let recipes = Array.from(store.values());

  if (!filters) return recipes;

  if (filters.difficulty) {
    recipes = recipes.filter((r) => r.difficulty === filters.difficulty);
  }

  if (filters.cuisine) {
    recipes = recipes.filter((r) => r.cuisine === filters.cuisine);
  }

  if (filters.maxCookingTime !== undefined) {
    recipes = recipes.filter(
      (r) => r.cookingTimeMinutes <= filters.maxCookingTime!
    );
  }

  if (filters.search) {
    const term = filters.search.toLowerCase();
    recipes = recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(term) ||
        (r.description && r.description.toLowerCase().includes(term))
    );
  }

  return recipes;
}

export function getRecipeById(id: string): Recipe | undefined {
  return store.get(id);
}

export function createRecipe(data: CreateRecipeInput): Recipe {
  const id = randomUUID();
  const now = new Date();
  const recipe: Recipe = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
  };
  store.set(id, recipe);
  return recipe;
}

export function updateRecipe(
  id: string,
  data: UpdateRecipeInput
): Recipe | undefined {
  const existing = store.get(id);
  if (!existing) return undefined;

  const updated: Recipe = {
    ...existing,
    ...data,
    id,
    createdAt: existing.createdAt,
    updatedAt: new Date(),
  };
  store.set(id, updated);
  return updated;
}

export function deleteRecipe(id: string): boolean {
  return store.delete(id);
}

export function clearStorage(): void {
  store.clear();
}

export function getQuickRecipes(maxMinutes = 30): Recipe[] {
  return getAllRecipes({ maxCookingTime: maxMinutes });
}
