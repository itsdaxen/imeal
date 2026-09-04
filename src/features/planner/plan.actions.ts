"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { SupabaseServerClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/session-user";

import { pickReplacement, planWeek } from "./generate";
import { ingredientsToAdd } from "./meal-ingredients";
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
    listId: formData.get("listId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the options." };
  }

  const { supabase, userId } = await requireUserId();
  const { weekStart, source, slots, listId } = parsed.data;

  if (listId) {
    const { data: destination } = await supabase
      .from("shopping_lists")
      .select("id")
      .eq("id", listId)
      .maybeSingle();

    if (!destination) {
      return { error: "That shopping list is no longer available." };
    }
  }

  const recipes = await listPlannableRecipes(source);
  const result = planWeek({
    locked: [],
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

  if (listId) {
    const { error: destinationError } = await supabase
      .from("meal_plans")
      .update({ target_list_id: listId })
      .eq("user_id", userId)
      .eq("week_start", weekStart);

    if (destinationError) {
      return {
        error: "The plan was made, but its shopping list could not be saved.",
      };
    }
  }

  revalidatePath("/planner");
  revalidatePath("/shopping");
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

/**
 * Approving a meal is the moment its ingredients are wanted, so it is also what puts
 * them on the week's list. Un-approving takes back the rows this meal added and that
 * nobody has ticked yet — anything already collected, or edited by hand, stays.
 */
/**
 * Puts one meal's ingredients on the week's list, skipping anything already there by
 * name so approving a second meal that shares an ingredient does not duplicate it.
 * Each row remembers the meal it came from so un-approving can undo exactly this.
 */
async function addMealIngredients({
  mealItemId,
  planId,
  recipeId,
  supabase,
  userId,
  weekStart,
}: {
  mealItemId: string;
  planId: string;
  recipeId: string;
  supabase: SupabaseServerClient;
  userId: string;
  weekStart: string;
}) {
  const listId = await resolveTargetList({ planId, supabase, userId });

  if (!listId) {
    return;
  }

  const [{ data: recipe }, { data: existing }] = await Promise.all([
    supabase
      .from("recipes")
      .select("ingredients")
      .eq("id", recipeId)
      .maybeSingle(),
    supabase.from("shopping_items").select("name").eq("list_id", listId),
  ]);

  if (!recipe) {
    return;
  }

  const ingredients = ingredientsToAdd(
    recipe.ingredients,
    (existing ?? []).map((item) => item.name),
  );

  if (ingredients.length === 0) {
    return;
  }

  await supabase.from("shopping_items").insert(
    ingredients.map((name) => ({
      list_id: listId,
      meal_plan_id: planId,
      meal_plan_item_id: mealItemId,
      name,
      source: "generated" as const,
      user_id: userId,
    })),
  );

  void weekStart;
}

/** The week's chosen list, falling back to the default one and remembering it. */
async function resolveTargetList({
  planId,
  supabase,
  userId,
}: {
  planId: string;
  supabase: SupabaseServerClient;
  userId: string;
}) {
  const { data: plan } = await supabase
    .from("meal_plans")
    .select("target_list_id")
    .eq("id", planId)
    .maybeSingle();

  if (plan?.target_list_id) {
    return plan.target_list_id;
  }

  const { data: fallback } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("owner_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!fallback) {
    return null;
  }

  await supabase
    .from("meal_plans")
    .update({ target_list_id: fallback.id })
    .eq("id", planId);

  return fallback.id;
}

export async function setMealApproval(formData: FormData) {
  const parsed = mealSchema.safeParse({
    weekStart: formData.get("weekStart"),
    itemId: formData.get("itemId"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();
  const { data: meal } = await supabase
    .from("meal_plan_items")
    .select("id, approved, recipe_id, meal_plan_id")
    .eq("id", parsed.data.itemId)
    .maybeSingle();

  if (!meal) {
    return;
  }

  // The plan has to be this user's own week, not one shared with them.
  const { data: plan } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("id", meal.meal_plan_id)
    .eq("user_id", userId)
    .eq("week_start", parsed.data.weekStart)
    .maybeSingle();

  if (!plan) {
    return;
  }

  const approving = !meal.approved;

  await supabase
    .from("meal_plan_items")
    .update({ approved: approving })
    .eq("id", meal.id);

  if (approving) {
    await addMealIngredients({
      mealItemId: meal.id,
      planId: plan.id,
      recipeId: meal.recipe_id,
      supabase,
      userId,
      weekStart: parsed.data.weekStart,
    });
  } else {
    await supabase
      .from("shopping_items")
      .delete()
      .eq("meal_plan_item_id", meal.id)
      .eq("user_id", userId)
      .eq("checked", false);
  }

  revalidatePath("/planner");
  revalidatePath("/shopping");
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
