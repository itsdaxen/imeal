import { z } from "zod";

export const MEAL_SLOTS = ["breakfast", "lunch", "snack", "dinner"] as const;

export type MealSlot = (typeof MEAL_SLOTS)[number];

const toLines = z.string().transform((value) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean),
);

export const recipeInputSchema = z.object({
  title: z.string().trim().min(1, "Give the recipe a title.").max(200),
  ingredients: toLines.pipe(
    z.array(z.string().max(200)).min(1, "Add at least one ingredient."),
  ),
  steps: toLines.pipe(
    z.array(z.string().max(2000)).min(1, "Add at least one step."),
  ),
  tip: z
    .string()
    .trim()
    .max(500)
    .transform((value) => value || null),
  prepMinutes: z.coerce
    .number()
    .int()
    .min(1, "Preparation time must be at least a minute.")
    .max(1440),
  servings: z.coerce
    .number()
    .int()
    .min(1, "Servings must be at least one.")
    .max(100),
  mealTags: z
    .array(z.enum(MEAL_SLOTS))
    .min(1, "Choose at least one meal this suits."),
  // A recipe without collections is the normal case, so the field is optional
  // rather than something every caller has to remember to pass.
  collectionTags: z
    .string()
    .default("")
    .transform((value) => [
      ...new Set(
        value
          .split(",")
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean),
      ),
    ])
    .pipe(z.array(z.string().max(40)).max(12)),
});

export type RecipeInput = z.output<typeof recipeInputSchema>;

export function parseRecipeForm(formData: FormData) {
  return recipeInputSchema.safeParse({
    title: formData.get("title") ?? "",
    ingredients: formData.get("ingredients") ?? "",
    steps: formData.get("steps") ?? "",
    tip: formData.get("tip") ?? "",
    prepMinutes: formData.get("prepMinutes") ?? "",
    servings: formData.get("servings") ?? "",
    mealTags: formData.getAll("mealTags"),
    collectionTags: formData.get("collectionTags") ?? "",
  });
}
