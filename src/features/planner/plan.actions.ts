"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { pickReplacement, planWeek } from "./generate";
import { listPlannableRecipes } from "./plan.queries";
import {
  generationSchema,
  mealSchema,
  slotAssignmentSchema,
  slotTargetSchema,
} from "./plan.schema";

export type PlannerFormState = {
  error?: string;
};

const SLOT_LABEL = {
  breakfast: "breakfast",
  lunch: "lunch",
  snack: "snack",
  dinner: "dinner",
} as const;

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

export async function generateWeekPlan(
  _previous: PlannerFormState,
  formData: FormData,
): Promise<PlannerFormState> {
  const parsed = generationSchema.safeParse({
    weekStart: formData.get("weekStart"),
    source: formData.get("source"),
    slots: formData.getAll("slots"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the options." };
  }

  const { supabase, userId } = await requireUserId();
  const { weekStart, source, slots } = parsed.data;

  const { data: plan } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();

  // Approved meals are decisions already made; they are kept and their recipes spent.
  const { data: approved } = plan
    ? await supabase
        .from("meal_plan_items")
        .select("day_index, slot, recipe_id")
        .eq("meal_plan_id", plan.id)
        .eq("approved", true)
    : { data: [] };

  const recipes = await listPlannableRecipes(source);
  const result = planWeek({
    locked: (approved ?? []).map((meal) => ({
      dayIndex: meal.day_index,
      slot: meal.slot,
      recipeId: meal.recipe_id,
    })),
    recipes,
    slots,
  });

  if (!result.ok) {
    return {
      error: `Only ${result.available} ${SLOT_LABEL[result.slot]} recipes are available, and ${result.needed} are needed. Add more, or choose a different source.`,
    };
  }

  const { error } = await supabase.rpc("apply_generated_plan", {
    p_week_start: weekStart,
    p_slots: slots,
    p_assignments: result.assignments,
  });

  if (error) {
    return { error: "Could not fill the week. Try again." };
  }

  revalidatePath("/planner");
  redirect(`/planner?week=${weekStart}`);
}

export async function shuffleMeal(formData: FormData) {
  const parsed = mealSchema.safeParse({
    weekStart: formData.get("weekStart"),
    itemId: formData.get("itemId"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase } = await requireUserId();
  const { data: meal } = await supabase
    .from("meal_plan_items")
    .select("id, slot, recipe_id, meal_plan_id")
    .eq("id", parsed.data.itemId)
    .maybeSingle();

  if (!meal) {
    return;
  }

  const { data: planned } = await supabase
    .from("meal_plan_items")
    .select("day_index, slot, recipe_id")
    .eq("meal_plan_id", meal.meal_plan_id);

  const replacement = pickReplacement({
    current: meal.recipe_id,
    planned: (planned ?? []).map((item) => ({
      dayIndex: item.day_index,
      slot: item.slot,
      recipeId: item.recipe_id,
    })),
    recipes: await listPlannableRecipes("both"),
    slot: meal.slot,
  });

  if (!replacement) {
    return;
  }

  // A swapped meal is a fresh proposal, so it is no longer approved.
  await supabase
    .from("meal_plan_items")
    .update({ recipe_id: replacement, approved: false })
    .eq("id", meal.id);

  revalidatePath("/planner");
}

export async function setMealApproval(formData: FormData) {
  const parsed = mealSchema.safeParse({
    weekStart: formData.get("weekStart"),
    itemId: formData.get("itemId"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase } = await requireUserId();
  const { data: meal } = await supabase
    .from("meal_plan_items")
    .select("id, approved")
    .eq("id", parsed.data.itemId)
    .maybeSingle();

  if (!meal) {
    return;
  }

  await supabase
    .from("meal_plan_items")
    .update({ approved: !meal.approved })
    .eq("id", meal.id);

  revalidatePath("/planner");
}

export async function approveWholeWeek(formData: FormData) {
  const parsed = slotTargetSchema
    .pick({ weekStart: true })
    .safeParse({ weekStart: formData.get("weekStart") });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();
  const { data: plan } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("user_id", userId)
    .eq("week_start", parsed.data.weekStart)
    .maybeSingle();

  if (!plan) {
    return;
  }

  await supabase
    .from("meal_plan_items")
    .update({ approved: true })
    .eq("meal_plan_id", plan.id);

  revalidatePath("/planner");
}

export async function deleteWeekPlan(formData: FormData) {
  const parsed = slotTargetSchema
    .pick({ weekStart: true })
    .safeParse({ weekStart: formData.get("weekStart") });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();

  // meal_plan_items and any shares cascade from the plan.
  await supabase
    .from("meal_plans")
    .delete()
    .eq("user_id", userId)
    .eq("week_start", parsed.data.weekStart);

  revalidatePath("/planner");
  redirect(`/planner?week=${parsed.data.weekStart}`);
}
