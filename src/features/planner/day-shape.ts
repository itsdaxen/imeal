import { MEAL_SLOTS, type MealSlot } from "@/features/recipes/recipe.schema";

/** What a day looks like when nobody has said otherwise. */
export const DEFAULT_DAY: MealSlot[] = [...MEAL_SLOTS];

/** More than this and a day stops being a day. */
export const MAX_MEALS_PER_DAY = 12;

const TITLE: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  dinner: "Dinner",
  lunch: "Lunch",
  snack: "Snack",
};

/**
 * A day is an ordered list of meal types, and the same type may appear twice.
 *
 * The position in that list is a meal's identity — what used to be the job of `slot`,
 * which could only say "the dinner" and so could only ever be one of them. A second
 * dinner is a second entry, and its index is what the planner and the database both
 * key on.
 */
export function mealLabel(day: readonly MealSlot[], index: number): string {
  const slot = day[index];

  if (!slot) {
    return "Meal";
  }

  const sameType = day.filter((entry) => entry === slot);

  if (sameType.length === 1) {
    return TITLE[slot];
  }

  // "Lunch 2" rather than "Custom meal 2": you asked for a second lunch, so the label
  // should say lunch. The numbering only exists to tell the two of them apart.
  const rank = day.slice(0, index + 1).filter((entry) => entry === slot).length;

  return `${TITLE[slot]} ${rank}`;
}

/**
 * The day that results from choosing which types to include and how many meals to cook.
 *
 * Choosing fewer types shortens the day, which is why the count follows the toggles
 * rather than arguing with them. Asking for more meals than types repeats the later
 * ones — a second lunch and a second dinner before a third of anything.
 */
export function buildDay(
  types: readonly MealSlot[],
  mealsPerDay: number,
): MealSlot[] {
  const chosen = MEAL_SLOTS.filter((slot) => types.includes(slot));

  if (chosen.length === 0) {
    return [];
  }

  const wanted = Math.min(
    Math.max(mealsPerDay, chosen.length),
    MAX_MEALS_PER_DAY,
  );
  const day = [...chosen];

  // Extras repeat the main meals of the day rather than adding more snacks.
  const extras = chosen.filter((slot) => slot === "lunch" || slot === "dinner");
  const repeat = extras.length > 0 ? extras : chosen;

  for (let index = day.length; index < wanted; index += 1) {
    day.push(repeat[(index - chosen.length) % repeat.length]);
  }

  return day;
}
