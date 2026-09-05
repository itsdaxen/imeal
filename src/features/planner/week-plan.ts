import "server-only";

import type { SupabaseServerClient } from "@/lib/supabase/server";

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
