import { Router, Request, Response, NextFunction } from 'express';
import {
  createRecipeSchema,
  updateRecipeSchema,
} from '../schemas/recipe.schema';
import {
  getAllRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getQuickRecipes,
  RecipeFilters,
} from '../storage/recipe';
import { validate } from '../middleware/validate';

const router = Router();

// GET /recipes/quick — спеціальний маршрут для швидких рецептів (до 30 хв)
router.get('/quick', (_req: Request, res: Response) => {
  const recipes = getQuickRecipes(30);
  res.json(recipes);
});

// GET /recipes — отримати всі рецепти з опціональною фільтрацією
router.get('/', (req: Request, res: Response) => {
  const filters: RecipeFilters = {};

  if (req.query.difficulty) {
    filters.difficulty = String(req.query.difficulty);
  }
  if (req.query.cuisine) {
    filters.cuisine = String(req.query.cuisine);
  }
  if (req.query.maxCookingTime) {
    const val = Number(req.query.maxCookingTime);
    if (!isNaN(val)) filters.maxCookingTime = val;
  }
  if (req.query.search) {
    filters.search = String(req.query.search);
  }

  const recipes = getAllRecipes(filters);
  res.json(recipes);
});

// GET /recipes/:id — отримати рецепт за id
router.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  const recipe = getRecipeById(req.params.id);
  if (!recipe) {
    res.status(404).json({ error: 'Рецепт не знайдено' });
    return;
  }
  res.json(recipe);
});

// POST /recipes — створити рецепт
router.post(
  '/',
  validate(createRecipeSchema),
  (req: Request, res: Response) => {
    const recipe = createRecipe(req.body);
    res.status(201).json(recipe);
  }
);

// PATCH /recipes/:id — оновити рецепт
router.patch(
  '/:id',
  validate(updateRecipeSchema),
  (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const recipe = updateRecipe(req.params.id, req.body);
      if (!recipe) {
        res.status(404).json({ error: 'Рецепт не знайдено' });
        return;
      }
      res.json(recipe);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /recipes/:id — видалити рецепт
router.delete('/:id', (req: Request<{ id: string }>, res: Response) => {
  const deleted = deleteRecipe(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Рецепт не знайдено' });
    return;
  }
  res.status(204).send();
});

export default router;
