"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const recipeSchema = z.object({ recipeId: z.uuid() });
const suggestionSchema = z.object({ suggestionId: z.uuid() });
const rejectionSchema = suggestionSchema.extend({
  note: z.string().trim().max(500).optional(),
});

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

export async function suggestRecipe(formData: FormData) {
  const parsed = recipeSchema.safeParse({ recipeId: formData.get("recipeId") });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();

  await supabase
    .from("recipe_suggestions")
    .insert({ recipe_id: parsed.data.recipeId, suggested_by: userId });

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
      "title, ingredients, steps, tip, prep_minutes, servings, meal_tags, collection_tags",
    )
    .eq("id", parsed.data.recipeId)
    .eq("visibility", "public")
    .maybeSingle();

  if (!source) {
    return;
  }

  // A copy, so editing your version never changes what the catalog shows.
  const { data: saved } = await supabase
    .from("recipes")
    .insert({
      owner_id: userId,
      title: source.title,
      ingredients: source.ingredients,
      steps: source.steps,
      tip: source.tip,
      prep_minutes: source.prep_minutes,
      servings: source.servings,
      meal_tags: source.meal_tags,
      collection_tags: source.collection_tags,
      source_recipe_id: parsed.data.recipeId,
    })
    .select("id")
    .single();

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

  await supabase.rpc("reject_recipe_suggestion", {
    p_suggestion_id: parsed.data.suggestionId,
    p_note: parsed.data.note,
  });

  revalidatePath("/admin");
}

export async function archiveCatalogRecipe(formData: FormData) {
  const parsed = recipeSchema.safeParse({ recipeId: formData.get("recipeId") });

  if (!parsed.success) {
    return;
  }

  const { supabase } = await requireUserId();

  await supabase.rpc("archive_catalog_recipe", {
    p_recipe_id: parsed.data.recipeId,
  });

  revalidatePath("/catalog");
  revalidatePath("/admin");
}
