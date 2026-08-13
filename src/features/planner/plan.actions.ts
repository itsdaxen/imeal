"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { slotAssignmentSchema, slotTargetSchema } from "./plan.schema";

async function requireUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return { supabase, userId: user.id };
}

export async function assignRecipeToSlot(formData: FormData) {
  const parsed = slotAssignmentSchema.safeParse({
    weekStart: formData.get("weekStart"),
    dayIndex: formData.get("dayIndex"),
    slot: formData.get("slot"),
    recipeId: formData.get("recipeId"),
  });

  if (!parsed.success) {
    throw new Error("That slot or recipe is not valid.");
  }

  const { supabase, userId } = await requireUserId();
  const { weekStart, dayIndex, slot, recipeId } = parsed.data;

  // An empty plan row is harmless if the item write fails, so these two writes
  // do not need a transaction.
  const { data: plan, error: planError } = await supabase
    .from("meal_plans")
    .upsert(
      { user_id: userId, week_start: weekStart },
      { onConflict: "user_id,week_start" },
    )
    .select("id")
    .single();

  if (planError) {
    throw new Error(`Could not open that week: ${planError.message}`);
  }

  const { error: itemError } = await supabase.from("meal_plan_items").upsert(
    {
      meal_plan_id: plan.id,
      recipe_id: recipeId,
      day_index: dayIndex,
      slot,
    },
    { onConflict: "meal_plan_id,day_index,slot" },
  );

  if (itemError) {
    throw new Error(`Could not plan that meal: ${itemError.message}`);
  }

  revalidatePath("/planner");
  redirect(`/planner?week=${weekStart}`);
}

export async function clearSlot(formData: FormData) {
  const parsed = slotTargetSchema.safeParse({
    weekStart: formData.get("weekStart"),
    dayIndex: formData.get("dayIndex"),
    slot: formData.get("slot"),
  });

  if (!parsed.success) {
    throw new Error("That slot is not valid.");
  }

  const { supabase, userId } = await requireUserId();
  const { weekStart, dayIndex, slot } = parsed.data;

  const { data: plan } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (!plan) {
    return;
  }

  const { error } = await supabase
    .from("meal_plan_items")
    .delete()
    .eq("meal_plan_id", plan.id)
    .eq("day_index", dayIndex)
    .eq("slot", slot);

  if (error) {
    throw new Error(`Could not clear that slot: ${error.message}`);
  }

  revalidatePath("/planner");
}
