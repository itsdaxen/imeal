import "server-only";

import type { SupabaseServerClient } from "@/lib/supabase/server";

import {
  DEFAULT_DAY,
  reshapeWeek,
  sameDay,
  sameEveryDay,
  toWeekShape,
} from "./day-shape";
import type { MealSlot } from "@/features/recipes/recipe.schema";
import { currentWeekStart } from "./week";

/**
 * A person's own plan for a week, or nothing.
 *
 * The `user_id` filter is the load-bearing part and the easy part to leave out: sharing
 * widened the read policy, so a query filtered on `week_start` alone can return a
 * friend's plan as well as your own — which is exactly how the planner once started
 * crashing with "multiple (or no) rows returned". Five call sites were each responsible
 * for remembering that. Now none of them are.
 */
export async function findWeekPlan(
  supabase: SupabaseServerClient,
  userId: string,
  weekStart: string,
) {
  const { data } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();

  return data;
}

/**
 * The plan row for a week, created if this is the first thing anyone does to it.
 *
 * A plain upsert would let the column default decide the shape of the day, which is
 * how a seven-meal day became a four-meal one the moment a meal was added to it: the
 * database's idea of a day won over the one in your settings. The row is only inserted
 * once, so the profile is read only when there is nothing to read it against.
 */
export async function openWeek(
  supabase: SupabaseServerClient,
  userId: string,
  weekStart: string,
) {
  const existing = await findWeekPlan(supabase, userId, weekStart);

  if (existing) {
    return existing;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("default_enabled_slots")
    .eq("id", userId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("meal_plans")
    .upsert(
      {
        day_slots: sameEveryDay(
          profile?.default_enabled_slots?.length
            ? profile.default_enabled_slots
            : DEFAULT_DAY,
        ),
        user_id: userId,
        week_start: weekStart,
      },
      { onConflict: "user_id,week_start" },
    )
    .select("id")
    .single();

  if (error) {
    throw new Error(`Could not open that week: ${error.message}`);
  }

  return data;
}

/**
 * Carries a change of default day into the weeks it should still affect.
 *
 * A week gets a row of its own the first time anything is done to it, and that row
 * froze the shape of its days: changing the setting afterwards reached every week you
 * had not touched yet and pointedly not the one you were looking at. Past weeks keep
 * their shape — they are a record of what you ate, not a plan — and so does any day
 * you shaped by hand.
 */
export async function applyDefaultDay(
  supabase: SupabaseServerClient,
  userId: string,
  from: readonly MealSlot[],
  to: readonly MealSlot[],
) {
  if (sameDay(from, to)) {
    return;
  }

  const { data: plans } = await supabase
    .from("meal_plans")
    .select("id, day_slots")
    .eq("user_id", userId)
    .gte("week_start", currentWeekStart());

  for (const plan of plans ?? []) {
    const week = toWeekShape(plan.day_slots);
    const reshaped = reshapeWeek(week, from, to);

    if (reshaped.every((day, index) => sameDay(day, week[index]))) {
      continue;
    }

    await supabase
      .from("meal_plans")
      .update({ day_slots: reshaped })
      .eq("id", plan.id);

    // A meal sitting past the end of a shortened day would be invisible in the planner
    // and still quietly land in the shopping list, which reads every planned meal.
    for (const [dayIndex, day] of reshaped.entries()) {
      if (day.length >= week[dayIndex].length) {
        continue;
      }

      await supabase
        .from("meal_plan_items")
        .delete()
        .eq("meal_plan_id", plan.id)
        .eq("day_index", dayIndex)
        .gte("slot_index", day.length);
    }
  }
}
