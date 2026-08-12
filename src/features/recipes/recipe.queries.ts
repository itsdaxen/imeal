import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { MealSlot } from "./recipe.schema";

const LIST_COLUMNS = "id, title, prep_minutes, servings, meal_tags, image_url";
const DETAIL_COLUMNS = `${LIST_COLUMNS}, ingredients, steps, tip, owner_id`;

export type RecipeListFilters = {
  search?: string;
  mealTag?: MealSlot;
};

export type RecipeSummary = {
  id: string;
  title: string;
  prep_minutes: number;
  servings: number;
  meal_tags: MealSlot[];
  image_url: string | null;
};

// PostgREST treats these as pattern metacharacters inside ilike.
function escapeLikePattern(value: string) {
  return value.replace(/[%_\\]/g, (match) => `\\${match}`);
}

export async function listOwnedRecipes(filters: RecipeListFilters = {}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Sharing widened the select policy, so this must filter by owner explicitly
  // rather than leaning on RLS to mean "mine".
  let query = supabase
    .from("recipes")
    .select(LIST_COLUMNS)
    .eq("owner_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const search = filters.search?.trim();

  if (search) {
    query = query.ilike("title", `%${escapeLikePattern(search)}%`);
  }

  if (filters.mealTag) {
    query = query.contains("meal_tags", [filters.mealTag]);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Could not load recipes: ${error.message}`);
  }

  return data;
}

export async function getRecipe(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("recipes")
    .select(DETAIL_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load the recipe: ${error.message}`);
  }

  return data;
}
