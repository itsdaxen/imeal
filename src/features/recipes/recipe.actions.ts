"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { parseRecipeForm } from "./recipe.schema";

export type RecipeFormState = {
  error?: string;
};

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

export async function createRecipe(
  _previous: RecipeFormState,
  formData: FormData,
): Promise<RecipeFormState> {
  const parsed = parseRecipeForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const { supabase, userId } = await requireUserId();
  const recipe = parsed.data;

  const { data, error } = await supabase
    .from("recipes")
    .insert({
      owner_id: userId,
      title: recipe.title,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      tip: recipe.tip,
      prep_minutes: recipe.prepMinutes,
      servings: recipe.servings,
      meal_tags: recipe.mealTags,
    })
    .select("id")
    .single();

  if (error) {
    return { error: "Could not save the recipe. Try again." };
  }

  revalidatePath("/recipes");
  redirect(`/recipes/${data.id}`);
}

export async function updateRecipe(
  id: string,
  _previous: RecipeFormState,
  formData: FormData,
): Promise<RecipeFormState> {
  const parsed = parseRecipeForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const { supabase, userId } = await requireUserId();
  const recipe = parsed.data;

  // RLS already restricts this to the owner; the filter makes the intent explicit
  // and turns a forbidden write into an empty result rather than a silent success.
  const { data, error } = await supabase
    .from("recipes")
    .update({
      title: recipe.title,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      tip: recipe.tip,
      prep_minutes: recipe.prepMinutes,
      servings: recipe.servings,
      meal_tags: recipe.mealTags,
    })
    .eq("id", id)
    .eq("owner_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: "Could not save the recipe. Try again." };
  }

  if (!data) {
    return { error: "That recipe is no longer yours to edit." };
  }

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);
  redirect(`/recipes/${id}`);
}

const FOREIGN_KEY_VIOLATION = "23503";

export async function deleteRecipe(
  id: string,
  _previous: RecipeFormState,
): Promise<RecipeFormState> {
  const { supabase, userId } = await requireUserId();

  const { error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", id)
    .eq("owner_id", userId);

  if (error?.code === FOREIGN_KEY_VIOLATION) {
    // meal_plan_items references recipes with `on delete restrict`.
    return {
      error: "This recipe is in a meal plan. Remove it from the plan first.",
    };
  }

  if (error) {
    return { error: "Could not delete the recipe. Try again." };
  }

  revalidatePath("/recipes");
  redirect("/recipes");
}
