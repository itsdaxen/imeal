import type { MealSlot } from "@/features/recipes/recipe.schema";

export type PlannableRecipe = {
  id: string;
  mealTags: ReadonlyArray<MealSlot>;
};

export type PlannedSlot = {
  dayIndex: number;
  slot: MealSlot;
  recipeId: string;
};

export type GenerationResult =
  | { ok: true; assignments: PlannedSlot[] }
  | { ok: false; slot: MealSlot; available: number; needed: number };

type PlanWeekOptions = {
  days?: number;
  /** Approved meals. They stay where they are and their recipes are spent. */
  locked?: ReadonlyArray<PlannedSlot>;
  recipes: ReadonlyArray<PlannableRecipe>;
  /** Injected so the selection can be made deterministic in tests. */
  shuffle?: <T>(items: ReadonlyArray<T>) => T[];
  slots: ReadonlyArray<MealSlot>;
};

const DAYS_IN_WEEK = 7;

function shuffleRandomly<T>(items: ReadonlyArray<T>): T[] {
  const pool = [...items];

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[swap]] = [pool[swap], pool[index]];
  }

  return pool;
}

/**
 * Fills a week from the recipes available, one recipe per week at most.
 *
 * A half-filled week is worse than none, so a slot without enough eligible
 * recipes fails the whole run and says which slot and by how much.
 */
export function planWeek({
  days = DAYS_IN_WEEK,
  locked = [],
  recipes,
  shuffle = shuffleRandomly,
  slots,
}: PlanWeekOptions): GenerationResult {
  const spent = new Set(locked.map((meal) => meal.recipeId));
  const assignments: PlannedSlot[] = [];

  for (const slot of slots) {
    const takenDays = new Set(
      locked.filter((meal) => meal.slot === slot).map((meal) => meal.dayIndex),
    );
    const openDays = Array.from({ length: days }, (_, day) => day).filter(
      (day) => !takenDays.has(day),
    );

    if (openDays.length === 0) {
      continue;
    }

    const eligible = recipes.filter(
      (recipe) => recipe.mealTags.includes(slot) && !spent.has(recipe.id),
    );

    if (eligible.length < openDays.length) {
      return {
        ok: false,
        slot,
        available: eligible.length,
        needed: openDays.length,
      };
    }

    const chosen = shuffle(eligible).slice(0, openDays.length);

    openDays.forEach((dayIndex, position) => {
      const recipe = chosen[position];
      spent.add(recipe.id);
      assignments.push({ dayIndex, slot, recipeId: recipe.id });
    });
  }

  return { ok: true, assignments };
}

/**
 * Swaps one meal for another the week is not already using.
 */
export function pickReplacement({
  current,
  planned,
  recipes,
  shuffle = shuffleRandomly,
  slot,
}: {
  current: string;
  planned: ReadonlyArray<PlannedSlot>;
  recipes: ReadonlyArray<PlannableRecipe>;
  shuffle?: <T>(items: ReadonlyArray<T>) => T[];
  slot: MealSlot;
}): string | null {
  const spent = new Set(planned.map((meal) => meal.recipeId));
  const eligible = recipes.filter(
    (recipe) =>
      recipe.mealTags.includes(slot) &&
      recipe.id !== current &&
      !spent.has(recipe.id),
  );

  return eligible.length === 0 ? null : (shuffle(eligible)[0]?.id ?? null);
}
