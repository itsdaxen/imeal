import { optionalUserId } from "@/lib/supabase/session-user";
import { escapeLikePattern } from "@/lib/text";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { MealSlot } from "./recipe.schema";

const LIST_COLUMNS =
  "id, title, prep_minutes, servings, meal_tags, collection_tags, image_url";
const DETAIL_COLUMNS = `${LIST_COLUMNS}, ingredients, steps, tip, owner_id, visibility`;

export type RecipeListFilters = {
  search?: string;
  mealTag?: MealSlot;
  archived?: boolean;
  collection?: string;
};

export type RecipeSummary = {
  id: string;
  title: string;
  prep_minutes: number;
  servings: number;
  meal_tags: MealSlot[];
  collection_tags: string[];
  image_url: string | null;
};

/**
 * The collections a person has actually used. Free text only works if you can see
 * what already exists — otherwise "asian" and "Asian food" become two collections.
 */
export async function listOwnedCollections(): Promise<string[]> {
  const { supabase, userId } = await optionalUserId();

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("recipes")
    .select("collection_tags")
    .eq("owner_id", userId)
    .eq("status", "active");

  if (error) {
    return [];
  }

  return [...new Set(data.flatMap((row) => row.collection_tags))].sort();
}

export async function listOwnedRecipes(filters: RecipeListFilters = {}) {
  const { supabase, userId } = await optionalUserId();

  if (!userId) {
    return [];
  }

  // Sharing widened the select policy, so this must filter by owner explicitly
  // rather than leaning on RLS to mean "mine".
  let query = supabase
    .from("recipes")
    .select(LIST_COLUMNS)
    .eq("owner_id", userId)
    .eq("status", filters.archived ? "archived" : "active")
    .order("created_at", { ascending: false });

  const search = filters.search?.trim();

  if (search) {
    query = query.ilike("title", `%${escapeLikePattern(search)}%`);
  }

  if (filters.mealTag) {
    query = query.contains("meal_tags", [filters.mealTag]);
  }

  if (filters.collection?.trim()) {
    query = query.contains("collection_tags", [filters.collection.trim()]);
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
