import { optionalUserId } from "@/lib/supabase/session-user";

import type { MealSlot } from "@/features/recipes/recipe.schema";
import {
  DEFAULT_DAY,
  sameEveryDay,
  toWeekShape,
  type WeekShape,
} from "./day-shape";

export type PlannedMeal = {
  id: string;
  approved: boolean;
  dayIndex: number;
  /** Which meal of the day this is, since a day may hold two lunches. */
  slotIndex: number;
  slot: MealSlot;
  recipe: {
    id: string;
    title: string;
    prepMinutes: number;
    imageUrl: string | null;
  };
};

export type WeekPlan = {
  planId: string | null;
  /** Seven days, each with its own run of meals. */
  days: WeekShape;
  meals: PlannedMeal[];
};

/**
 * The day a week starts from before anyone has planned it.
 *
 * Read from the profile rather than assumed: the planning defaults were saved and then
 * never consulted by anything, so changing them appeared to do nothing at all.
 */
async function defaultDay(
  supabase: Awaited<ReturnType<typeof optionalUserId>>["supabase"],
  userId: string,
): Promise<MealSlot[]> {
  const { data } = await supabase
    .from("profiles")
    .select("default_enabled_slots")
    .eq("id", userId)
    .maybeSingle();

  return data?.default_enabled_slots?.length
    ? data.default_enabled_slots
    : DEFAULT_DAY;
}

export async function getWeekPlan(weekStart: string): Promise<WeekPlan> {
  const { supabase, userId } = await optionalUserId();

  if (!userId) {
    return { days: sameEveryDay(DEFAULT_DAY), meals: [], planId: null };
  }

  // Scoped to this user explicitly: a week someone shares with you is readable
  // under RLS, so filtering on the date alone matches their plan as well as yours
  // and the single-row read fails the moment anyone shares a week.
  const { data: plan, error: planError } = await supabase
    .from("meal_plans")
    .select("id, day_slots")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (planError) {
    throw new Error(`Could not load the week: ${planError.message}`);
  }

  if (!plan) {
    return {
      days: sameEveryDay(await defaultDay(supabase, userId)),
      meals: [],
      planId: null,
    };
  }

  const { data: items, error: itemsError } = await supabase
    .from("meal_plan_items")
    .select(
      "id, approved, day_index, slot_index, slot, recipes (id, title, prep_minutes, image_url)",
    )
    .eq("meal_plan_id", plan.id)
    .order("day_index")
    .order("slot_index");

  if (itemsError) {
    throw new Error(`Could not load the planned meals: ${itemsError.message}`);
  }

  const meals = items
    .filter((item) => item.recipes !== null)
    .map((item) => ({
      id: item.id,
      approved: item.approved,
      dayIndex: item.day_index,
      slotIndex: item.slot_index,
      slot: item.slot,
      recipe: {
        id: item.recipes.id,
        title: item.recipes.title,
        prepMinutes: item.recipes.prep_minutes,
        imageUrl: item.recipes.image_url,
      },
    }));

  return { days: toWeekShape(plan.day_slots), meals, planId: plan.id };
}

export function mealAt(plan: WeekPlan, dayIndex: number, slotIndex: number) {
  return plan.meals.find(
    (meal) => meal.dayIndex === dayIndex && meal.slotIndex === slotIndex,
  );
}

export type PlannableRecipeRow = {
  id: string;
  mealTags: MealSlot[];
};

/**
 * The pool a week can be filled from. "both" mirrors the source the old planner
 * offered: your own recipes together with the public catalog.
 */
export async function listPlannableRecipes(
  source: "mine" | "catalog" | "both",
): Promise<PlannableRecipeRow[]> {
  const { supabase, userId } = await optionalUserId();

  if (!userId) {
    return [];
  }

  let query = supabase
    .from("recipes")
    .select("id, meal_tags")
    .eq("status", "active");

  if (source === "mine") {
    query = query.eq("owner_id", userId);
  } else if (source === "catalog") {
    query = query.eq("visibility", "public");
  } else {
    query = query.or(`owner_id.eq.${userId},visibility.eq.public`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Could not load recipes to plan from: ${error.message}`);
  }

  return data.map((recipe) => ({ id: recipe.id, mealTags: recipe.meal_tags }));
}
