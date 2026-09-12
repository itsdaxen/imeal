import { optionalUserId } from "@/lib/supabase/session-user";
import { escapeLikePattern } from "@/lib/text";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { MealSlot } from "./recipe.schema";

/** Everything a recipe card draws, so the catalog and the library cannot drift apart. */
export const SUMMARY_COLUMNS =
  "id, title, prep_minutes, servings, meal_tags, collection_tags, image_url";
const DETAIL_COLUMNS = `${SUMMARY_COLUMNS}, ingredients, steps, tip, owner_id, visibility`;

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

export const RECIPE_PAGE_SIZE = 15;

export type RecipePage = {
  recipes: RecipeSummary[];
  hasMore: boolean;
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

async function ownedRecipes(
  filters: RecipeListFilters,
  offset?: number,
): Promise<RecipeSummary[]> {
  const { supabase, userId } = await optionalUserId();

  if (!userId) {
    return [];
  }

  // Sharing widened the select policy, so this must filter by owner explicitly
  // rather than leaning on RLS to mean "mine".
  let query = supabase
    .from("recipes")
    .select(SUMMARY_COLUMNS)
    .eq("owner_id", userId)
    .eq("status", filters.archived ? "archived" : "active")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

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

  if (offset !== undefined) {
    query = query.range(offset, offset + RECIPE_PAGE_SIZE);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Could not load recipes: ${error.message}`);
  }

  return data;
}

export async function listOwnedRecipes(filters: RecipeListFilters = {}) {
  return ownedRecipes(filters);
}

export async function listOwnedRecipePage(
  filters: RecipeListFilters,
  offset = 0,
): Promise<RecipePage> {
  const rows = await ownedRecipes(filters, offset);

  return {
    recipes: rows.slice(0, RECIPE_PAGE_SIZE),
    hasMore: rows.length > RECIPE_PAGE_SIZE,
  };
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
