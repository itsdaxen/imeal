import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { MealSlot } from "@/features/recipes/recipe.schema";

export type SharedRecipe = {
  id: string;
  title: string;
  prepMinutes: number;
  servings: number;
  mealTags: MealSlot[];
  imageUrl: string | null;
  sharedBy: string;
};

export async function listRecipesSharedWithMe(): Promise<SharedRecipe[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("recipe_shares")
    .select(
      `recipes (id, title, prep_minutes, servings, meal_tags, image_url),
       owner:profiles!recipe_shares_shared_by_fkey (display_name)`,
    )
    .eq("shared_with", user.id);

  if (error) {
    throw new Error(`Could not load shared recipes: ${error.message}`);
  }

  return data
    .filter((row) => row.recipes !== null)
    .map((row) => ({
      id: row.recipes.id,
      title: row.recipes.title,
      prepMinutes: row.recipes.prep_minutes,
      servings: row.recipes.servings,
      mealTags: row.recipes.meal_tags,
      imageUrl: row.recipes.image_url,
      sharedBy: row.owner?.display_name?.trim() || "A friend",
    }));
}

export async function listShareRecipients(recipeId: string): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("recipe_shares")
    .select("shared_with")
    .eq("recipe_id", recipeId);

  if (error) {
    throw new Error(`Could not load who this is shared with: ${error.message}`);
  }

  return data.map((row) => row.shared_with);
}
