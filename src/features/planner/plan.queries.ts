import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { MealSlot } from "@/features/recipes/recipe.schema";

export type PlannedMeal = {
  id: string;
  dayIndex: number;
  slot: MealSlot;
  recipe: { id: string; title: string; prepMinutes: number };
};

export type WeekPlan = {
  planId: string | null;
  enabledSlots: MealSlot[];
  meals: PlannedMeal[];
};

const DEFAULT_SLOTS: MealSlot[] = ["breakfast", "lunch", "snack", "dinner"];

export async function getWeekPlan(weekStart: string): Promise<WeekPlan> {
  const supabase = await createSupabaseServerClient();

  const { data: plan, error: planError } = await supabase
    .from("meal_plans")
    .select("id, enabled_slots")
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
    .select("id, day_index, slot, recipes (id, title, prep_minutes)")
    .eq("meal_plan_id", plan.id);

  if (itemsError) {
    throw new Error(`Could not load the planned meals: ${itemsError.message}`);
  }

  const meals = items
    .filter((item) => item.recipes !== null)
    .map((item) => ({
      id: item.id,
      dayIndex: item.day_index,
      slot: item.slot,
      recipe: {
        id: item.recipes.id,
        title: item.recipes.title,
        prepMinutes: item.recipes.prep_minutes,
      },
    }));

  return { planId: plan.id, enabledSlots: plan.enabled_slots, meals };
}

export function mealAt(plan: WeekPlan, dayIndex: number, slot: MealSlot) {
  return plan.meals.find(
    (meal) => meal.dayIndex === dayIndex && meal.slot === slot,
  );
}
