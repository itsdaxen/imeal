"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUserId } from "@/lib/supabase/session-user";

const recipeSchema = z.object({ recipeId: z.uuid() });
const shareSchema = recipeSchema.extend({ friendId: z.uuid() });

export async function shareRecipe(formData: FormData) {
  const parsed = shareSchema.safeParse({
    recipeId: formData.get("recipeId"),
    friendId: formData.get("friendId"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();

  // Ownership and friendship are both enforced by the insert policy.
  await supabase.from("recipe_shares").insert({
    recipe_id: parsed.data.recipeId,
    shared_with: parsed.data.friendId,
    shared_by: userId,
  });

  revalidatePath(`/recipes/${parsed.data.recipeId}`);
}

export async function unshareRecipe(formData: FormData) {
  const parsed = shareSchema.safeParse({
    recipeId: formData.get("recipeId"),
    friendId: formData.get("friendId"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();

  await supabase
    .from("recipe_shares")
    .delete()
    .eq("recipe_id", parsed.data.recipeId)
    .eq("shared_with", parsed.data.friendId)
    .eq("shared_by", userId);

  revalidatePath(`/recipes/${parsed.data.recipeId}`);
}

export async function dropSharedRecipe(formData: FormData) {
  const parsed = recipeSchema.safeParse({
    recipeId: formData.get("recipeId"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();

  await supabase
    .from("recipe_shares")
    .delete()
    .eq("recipe_id", parsed.data.recipeId)
    .eq("shared_with", userId);

  revalidatePath("/recipes/shared");
}

export async function copySharedRecipe(formData: FormData) {
  const parsed = recipeSchema.safeParse({
    recipeId: formData.get("recipeId"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();
  const { data: share, error: shareError } = await supabase
    .from("recipe_shares")
    .select(
      `recipes (
        id, title, ingredients, steps, tip, image_url,
        prep_minutes, servings, meal_tags, visibility, status
      )`,
    )
    .eq("recipe_id", parsed.data.recipeId)
    .eq("shared_with", userId)
    .maybeSingle();
  const source = share?.recipes;

  if (shareError) {
    throw new Error("Could not read the shared recipe. Try again.");
  }

  if (
    !source ||
    source.visibility !== "private" ||
    source.status !== "active"
  ) {
    return;
  }

  const { data: existing, error: existingError } = await supabase
    .from("recipes")
    .select("id")
    .eq("owner_id", userId)
    .eq("source_recipe_id", source.id)
    .eq("visibility", "private")
    .eq("status", "active")
    .maybeSingle();

  if (existingError) {
    throw new Error("Could not check your recipes. Try again.");
  }

  if (existing) {
    redirect(`/recipes/${existing.id}`);
  }

  const { data: copied, error: copyError } = await supabase
    .from("recipes")
    .insert({
      owner_id: userId,
      title: source.title,
      ingredients: source.ingredients,
      steps: source.steps,
      tip: source.tip,
      image_url: source.image_url,
      prep_minutes: source.prep_minutes,
      servings: source.servings,
      meal_tags: source.meal_tags,
      source_recipe_id: source.id,
    })
    .select("id")
    .single();

  if (copyError) {
    throw new Error("Could not save the recipe. Try again.");
  }

  revalidatePath("/recipes");
  revalidatePath("/recipes/shared");

  if (copied) {
    redirect(`/recipes/${copied.id}`);
  }
}
