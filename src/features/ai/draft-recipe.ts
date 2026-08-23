import { z } from "zod";

import { MEAL_SLOTS } from "@/features/recipes/recipe.schema";

export const MAX_PASTED_CHARACTERS = 8000;

/**
 * The shape a draft must arrive in, whoever produced it. A model's output is
 * untrusted: parsing JSON is not validating it, so this is what decides.
 */
export const draftRecipeSchema = z.object({
  title: z.string().trim().min(1).max(200),
  ingredients: z.array(z.string().trim().min(1).max(200)).min(1).max(60),
  steps: z.array(z.string().trim().min(1).max(2000)).min(1).max(40),
  tip: z.string().trim().max(500).nullable(),
  prepMinutes: z.number().int().min(1).max(1440),
  servings: z.number().int().min(1).max(100),
  mealTags: z.array(z.enum(MEAL_SLOTS)).min(1),
});

export type DraftRecipe = z.output<typeof draftRecipeSchema>;

const INGREDIENT_HEADING = /^(ingredients|you will need|shopping list)\b/i;
const STEP_HEADING = /^(steps|method|instructions|directions|preparation)\b/i;
const TIP_HEADING = /^(tip|note|chef'?s note)\b/i;
const SERVES = /serves\s+(\d{1,3})|(\d{1,3})\s+servings?/i;
const MINUTES = /(\d{1,4})\s*(?:minutes|minute|mins|min)\b/i;
const HOURS = /(\d{1,2})\s*(?:hours|hour|hrs|hr)\b/i;
const BULLET = /^\s*(?:[-*•·]|\d{1,2}[.)])\s*/;
// A line that only states servings or timing is about the recipe, not part of it.
const METADATA =
  /^(?:serves\b|prep\b|cook\b|total\b|ready in\b|\d+\s*(?:servings?|minutes?|mins?|hours?|hrs?)\b)/i;

function clean(line: string) {
  return line.replace(BULLET, "").trim();
}

/**
 * Reads a pasted recipe into a draft.
 *
 * This is deliberately the whole implementation and not a placeholder: the product
 * must work with no model and no key, so the deterministic reading is the floor and
 * a model, when one is configured, only has to beat it.
 */
export function draftRecipeFromText(text: string): DraftRecipe | null {
  const lines = text
    .slice(0, MAX_PASTED_CHARACTERS)
    .split("\n")
    .map((line) => line.trimEnd());

  const meaningful = lines.filter((line) => line.trim().length > 0);

  if (meaningful.length === 0) {
    return null;
  }

  const title = clean(meaningful[0]).slice(0, 200);
  const ingredients: string[] = [];
  const steps: string[] = [];
  const tips: string[] = [];
  let section: "none" | "ingredients" | "steps" | "tip" = "none";

  for (const raw of meaningful.slice(1)) {
    const line = raw.trim();

    if (INGREDIENT_HEADING.test(line)) {
      section = "ingredients";
      continue;
    }

    if (STEP_HEADING.test(line)) {
      section = "steps";
      continue;
    }

    if (TIP_HEADING.test(line)) {
      section = "tip";
      continue;
    }

    const value = clean(line);

    if (value.length === 0) {
      continue;
    }

    if (section === "ingredients") {
      ingredients.push(value.slice(0, 200));
    } else if (section === "steps") {
      steps.push(value.slice(0, 2000));
    } else if (section === "tip") {
      tips.push(value);
    } else if (METADATA.test(value)) {
      // Servings and timing are read from the whole text further down.
      continue;
    } else if (BULLET.test(line) || value.length < 60) {
      // Before any heading, short or bulleted lines read as ingredients.
      ingredients.push(value.slice(0, 200));
    } else {
      steps.push(value.slice(0, 2000));
    }
  }

  if (ingredients.length === 0 || steps.length === 0) {
    return null;
  }

  const servesMatch = text.match(SERVES);
  const minutesMatch = text.match(MINUTES);
  const hoursMatch = text.match(HOURS);

  const draft = {
    title,
    ingredients,
    steps,
    tip: tips.length > 0 ? tips.join(" ").slice(0, 500) : null,
    prepMinutes: minutesMatch
      ? Number(minutesMatch[1])
      : hoursMatch
        ? Number(hoursMatch[1]) * 60
        : 30,
    servings: servesMatch ? Number(servesMatch[1] ?? servesMatch[2]) : 4,
    mealTags: ["lunch", "dinner"],
  };

  const validated = draftRecipeSchema.safeParse(draft);

  return validated.success ? validated.data : null;
}
