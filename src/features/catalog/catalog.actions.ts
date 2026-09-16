"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUserId } from "@/lib/supabase/session-user";
import { copyRecipeInto } from "@/features/recipes/copy-recipe";

const recipeSchema = z.object({ recipeId: z.uuid() });
const suggestionSchema = z.object({ suggestionId: z.uuid() });
const rejectionSchema = suggestionSchema.extend({
  note: z.string().trim().max(500).optional(),
});

export async function suggestRecipe(formData: FormData) {
  const parsed = recipeSchema.safeParse({ recipeId: formData.get("recipeId") });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();

  const { error } = await supabase
    .from("recipe_suggestions")
    .insert({ recipe_id: parsed.data.recipeId, suggested_by: userId });

  if (error) {
    throw new Error("Could not send that suggestion. Try again.");
  }

  revalidatePath(`/recipes/${parsed.data.recipeId}`);
}

export async function withdrawSuggestion(formData: FormData) {
  const parsed = suggestionSchema.safeParse({
    suggestionId: formData.get("suggestionId"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();

  // A suggestion that is no longer pending has been answered by an editor, and
  // withdrawing an answered suggestion is meant to do nothing.
  await supabase
    .from("recipe_suggestions")
    .delete()
    .eq("id", parsed.data.suggestionId)
    .eq("suggested_by", userId);

  revalidatePath("/catalog");
}

export async function saveCatalogRecipe(formData: FormData) {
  const parsed = recipeSchema.safeParse({ recipeId: formData.get("recipeId") });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();

  const { data: source } = await supabase
    .from("recipes")
    .select(
      "title, ingredients, steps, tip, image_url, prep_minutes, servings, meal_tags, collection_tags",
    )
    .eq("id", parsed.data.recipeId)
    .eq("visibility", "public")
    .maybeSingle();

  if (!source) {
    return;
  }

  // A copy, so editing your version never changes what the catalog shows.
  const { data: saved } = await copyRecipeInto(
    supabase,
    userId,
    parsed.data.recipeId,
    source,
  );

  revalidatePath("/recipes");

  if (saved) {
    redirect(`/recipes/${saved.id}`);
  }
}

export async function approveSuggestion(formData: FormData) {
  const parsed = suggestionSchema.safeParse({
    suggestionId: formData.get("suggestionId"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase } = await requireUserId();

  // Authorization lives in the function; a non-admin call raises and changes nothing.
  await supabase.rpc("approve_recipe_suggestion", {
    p_suggestion_id: parsed.data.suggestionId,
  });

  revalidatePath("/admin");
  revalidatePath("/catalog");
}

export async function rejectSuggestion(formData: FormData) {
  const parsed = rejectionSchema.safeParse({
    suggestionId: formData.get("suggestionId"),
    note: formData.get("note") ?? undefined,
  });

  if (!parsed.success) {
    return;
  }

  const { supabase } = await requireUserId();

  const { error } = await supabase.rpc("reject_recipe_suggestion", {
    p_suggestion_id: parsed.data.suggestionId,
    p_note: parsed.data.note,
  });

  if (error) {
    throw new Error("Could not reject that suggestion. Try again.");
  }

  revalidatePath("/admin");
}

export async function archiveCatalogRecipe(formData: FormData) {
  const parsed = recipeSchema.safeParse({ recipeId: formData.get("recipeId") });

  if (!parsed.success) {
    return;
  }

  const { supabase } = await requireUserId();

  const { error } = await supabase.rpc("archive_catalog_recipe", {
    p_recipe_id: parsed.data.recipeId,
  });

  if (error) {
    throw new Error("Could not delete the catalog recipe.");
  }

  revalidatePath("/catalog");
  revalidatePath("/admin");
  redirect("/catalog");
}
