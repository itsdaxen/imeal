import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { MealSlot } from "@/features/recipes/recipe.schema";

export type PlannedMeal = {
  id: string;
  approved: boolean;
  dayIndex: number;
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
  enabledSlots: MealSlot[];
  meals: PlannedMeal[];
};

const DEFAULT_SLOTS: MealSlot[] = ["breakfast", "lunch", "snack", "dinner"];

export async function getWeekPlan(weekStart: string): Promise<WeekPlan> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { planId: null, enabledSlots: DEFAULT_SLOTS, meals: [] };
  }

  // Scoped to this user explicitly: a week someone shares with you is readable
  // under RLS, so filtering on the date alone matches their plan as well as yours
  // and the single-row read fails the moment anyone shares a week.
  const { data: plan, error: planError } = await supabase
    .from("meal_plans")
    .select("id, enabled_slots")
    .eq("user_id", user.id)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (planError) {
    throw new Error(`Could not load the week: ${planError.message}`);
  }

  if (!plan) {
    return { planId: null, enabledSlots: DEFAULT_SLOTS, meals: [] };
  }

  const { data: items, error: itemsError } = await supabase
    .from("meal_plan_items")
    .select(
      "id, approved, day_index, slot, recipes (id, title, prep_minutes, image_url)",
    )
    .eq("meal_plan_id", plan.id);

  if (itemsError) {
    throw new Error(`Could not load the planned meals: ${itemsError.message}`);
  }

  const meals = items
    .filter((item) => item.recipes !== null)
    .map((item) => ({
      id: item.id,
      approved: item.approved,
      dayIndex: item.day_index,
      slot: item.slot,
      recipe: {
        id: item.recipes.id,
        title: item.recipes.title,
        prepMinutes: item.recipes.prep_minutes,
        imageUrl: item.recipes.image_url,
      },
    }));

  return { planId: plan.id, enabledSlots: plan.enabled_slots, meals };
}

export function mealAt(plan: WeekPlan, dayIndex: number, slot: MealSlot) {
  return plan.meals.find(
    (meal) => meal.dayIndex === dayIndex && meal.slot === slot,
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
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  let query = supabase
    .from("recipes")
    .select("id, meal_tags")
    .eq("status", "active");

  if (source === "mine") {
    query = query.eq("owner_id", user.id);
  } else if (source === "catalog") {
    query = query.eq("visibility", "public");
  } else {
    query = query.or(`owner_id.eq.${user.id},visibility.eq.public`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Could not load recipes to plan from: ${error.message}`);
  }

  return data.map((recipe) => ({ id: recipe.id, mealTags: recipe.meal_tags }));
}
