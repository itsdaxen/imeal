import { optionalUserId } from "@/lib/supabase/session-user";

export type SharedPlan = {
  planId: string;
  weekStart: string;
  sharedBy: string;
  meals: number;
};

export async function listPlansSharedWithMe(): Promise<SharedPlan[]> {
  const { supabase, userId } = await optionalUserId();

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("meal_plan_shares")
    .select(
      `meal_plan_id,
       meal_plans (week_start, meal_plan_items (id)),
       owner:profiles!meal_plan_shares_owner_id_fkey (display_name)`,
    )
    .eq("recipient_id", userId);

  if (error) {
    throw new Error(`Could not load shared weeks: ${error.message}`);
  }

  return data
    .filter((row) => row.meal_plans !== null)
    .map((row) => ({
      planId: row.meal_plan_id,
      weekStart: row.meal_plans.week_start,
      sharedBy: row.owner?.display_name?.trim() || "A friend",
      meals: row.meal_plans.meal_plan_items.length,
    }));
}

export async function listPlanRecipients(weekStart: string): Promise<string[]> {
  const { supabase, userId } = await optionalUserId();

  if (!userId) {
    return [];
  }

  const { data: plan } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (!plan) {
    return [];
  }

  const { data, error } = await supabase
    .from("meal_plan_shares")
    .select("recipient_id")
    .eq("meal_plan_id", plan.id);

  if (error) {
    throw new Error(
      `Could not load who this week is shared with: ${error.message}`,
    );
  }

  return data.map((row) => row.recipient_id);
}
