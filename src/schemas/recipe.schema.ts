import { z } from 'zod';

export const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'] as const;
export const CUISINE_TYPES = [
  'ukrainian',
  'italian',
  'asian',
  'american',
  'french',
  'other',
] as const;

export const createRecipeSchema = z.object({
  title: z
    .string()
    .min(1, "Назва обов'язкова")
    .max(100, 'Назва не може перевищувати 100 символів'),

  description: z
    .string()
    .max(500, 'Опис не може перевищувати 500 символів')
    .optional(),

  cookingTimeMinutes: z
    .number()
    .int('Час приготування має бути цілим числом')
    .min(1, 'Час приготування має бути не менше 1 хвилини')
    .max(1440, 'Час приготування не може перевищувати 1440 хвилин (24 год)'),

  difficulty: z.enum(DIFFICULTY_LEVELS, {
    errorMap: () => ({
      message: `Складність має бути одним з: ${DIFFICULTY_LEVELS.join(', ')}`,
    }),
  }),

  cuisine: z
    .enum(CUISINE_TYPES, {
      errorMap: () => ({
        message: `Кухня має бути одним з: ${CUISINE_TYPES.join(', ')}`,
      }),
    })
    .optional(),

  servings: z
    .number()
    .int('Кількість порцій має бути цілим числом')
    .min(1, 'Кількість порцій має бути не менше 1')
    .max(100, 'Кількість порцій не може перевищувати 100')
    .optional(),
});

export const updateRecipeSchema = createRecipeSchema.partial();

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;

export type Recipe = CreateRecipeInput & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};
