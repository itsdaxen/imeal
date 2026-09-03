"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { RECIPE_IMAGE_MAX_BYTES } from "@/features/images/image";
import {
  chosenFile,
  removeStoredImage,
  storeImage,
} from "@/features/images/upload";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { collectionTagsSchema, parseRecipeForm } from "./recipe.schema";

export type RecipeFormState = {
  error?: string;
  /** Changes on every save, so a form can tell one save from the next. */
  savedAt?: number;
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

async function uploadedImage(
  formData: FormData,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
): Promise<{ url?: string } | { error: string }> {
  const file = chosenFile(formData.get("image"));

  if (!file) {
    return {};
  }

  const stored = await storeImage({
    bucket: "recipe-images",
    file,
    maxBytes: RECIPE_IMAGE_MAX_BYTES,
    supabase,
    userId,
  });

  return "error" in stored ? stored : { url: stored.url };
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

  const image = await uploadedImage(formData, supabase, userId);

  if ("error" in image) {
    return { error: image.error };
  }

  const { data, error } = await supabase
    .from("recipes")
    .insert({
      owner_id: userId,
      image_url: image.url ?? null,
      title: recipe.title,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      tip: recipe.tip,
      prep_minutes: recipe.prepMinutes,
      servings: recipe.servings,
      meal_tags: recipe.mealTags,
      collection_tags: recipe.collectionTags,
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

  const image = await uploadedImage(formData, supabase, userId);
  const removeImage = formData.get("remove-image") === "on";

  if ("error" in image) {
    return { error: image.error };
  }

  // A catalog recipe has no owner, so a moderator editing one cannot be matched by
  // an owner filter. RLS decides in both cases; the filter only narrows the owner's,
  // turning a forbidden write into an empty result rather than a silent success.
  const { data: existing } = await supabase
    .from("recipes")
    .select("owner_id, image_url")
    .eq("id", id)
    .maybeSingle();

  const update = supabase
    .from("recipes")
    .update({
      // Leaving the file input empty keeps whatever photograph is already there.
      ...(image.url
        ? { image_url: image.url }
        : removeImage
          ? { image_url: null }
          : {}),
      title: recipe.title,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      tip: recipe.tip,
      prep_minutes: recipe.prepMinutes,
      servings: recipe.servings,
      meal_tags: recipe.mealTags,
      collection_tags: recipe.collectionTags,
    })
    .eq("id", id);

  const { data, error } = await (
    existing?.owner_id === null ? update : update.eq("owner_id", userId)
  )
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: "Could not save the recipe. Try again." };
  }

  if (!data) {
    return { error: "That recipe is no longer yours to edit." };
  }

  if ((image.url || removeImage) && existing?.image_url) {
    await removeStoredImage({
      bucket: "recipe-images",
      publicUrl: existing.image_url,
      supabase,
      userId,
    });
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

/**
 * Replaces a recipe's collections. Sent from the recipe's own menu, so the whole set
 * arrives at once rather than one add at a time — which also makes removing the last
 * collection expressible.
 */
export async function setRecipeCollections(
  _previous: RecipeFormState,
  formData: FormData,
): Promise<RecipeFormState> {
  const parsed = z
    .object({
      recipeId: z.uuid(),
      collectionTags: collectionTagsSchema,
    })
    .safeParse({
      recipeId: formData.get("recipeId"),
      collectionTags: formData.get("collectionTags") ?? "",
    });

  if (!parsed.success) {
    return { error: "Those collection names are not valid." };
  }

  const { supabase, userId } = await requireUserId();
  const { error } = await supabase
    .from("recipes")
    .update({ collection_tags: parsed.data.collectionTags })
    .eq("id", parsed.data.recipeId)
    .eq("owner_id", userId);

  if (error) {
    return { error: "Could not save the collections. Try again." };
  }

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${parsed.data.recipeId}`);

  return { savedAt: Date.now() };
}

export async function setRecipeArchived(
  id: string,
  archived: boolean,
): Promise<void> {
  const { supabase, userId } = await requireUserId();

  // Archiving keeps the recipe out of the library and the planner's pool while
  // leaving past weeks that reference it intact, which deleting cannot do.
  await supabase
    .from("recipes")
    .update({ status: archived ? "archived" : "active" })
    .eq("id", id)
    .eq("owner_id", userId);

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);
}

export async function archiveRecipe(formData: FormData) {
  const id = z.uuid().safeParse(formData.get("recipeId"));

  if (id.success) {
    await setRecipeArchived(id.data, true);
  }
}

export async function restoreRecipe(formData: FormData) {
  const id = z.uuid().safeParse(formData.get("recipeId"));

  if (id.success) {
    await setRecipeArchived(id.data, false);
  }
}
