import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { MealSlot } from "@/features/recipes/recipe.schema";

export type CatalogRecipe = {
  id: string;
  title: string;
  prepMinutes: number;
  servings: number;
  mealTags: MealSlot[];
};

export type Suggestion = {
  id: string;
  status: "pending" | "approved" | "rejected";
  reviewerNote: string | null;
  recipe: { id: string; title: string };
};

export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("is_admin");

  return !error && Boolean(data);
}

export async function listCatalog(search?: string): Promise<CatalogRecipe[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("recipes")
    .select("id, title, prep_minutes, servings, meal_tags")
    .eq("visibility", "public")
    .eq("status", "active")
    .order("title", { ascending: true });

  const term = search?.trim();

  if (term) {
    query = query.ilike(
      "title",
      `%${term.replace(/[%_\\]/g, (m) => `\\${m}`)}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Could not load the catalog: ${error.message}`);
  }

  return data.map((recipe) => ({
    id: recipe.id,
    title: recipe.title,
    prepMinutes: recipe.prep_minutes,
    servings: recipe.servings,
    mealTags: recipe.meal_tags,
  }));
}

function toSuggestion(row: {
  id: string;
  status: "pending" | "approved" | "rejected";
  reviewer_note: string | null;
  recipes: { id: string; title: string } | null;
}): Suggestion | null {
  return row.recipes
    ? {
        id: row.id,
        status: row.status,
        reviewerNote: row.reviewer_note,
        recipe: { id: row.recipes.id, title: row.recipes.title },
      }
    : null;
}

export async function listMySuggestions(): Promise<Suggestion[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("recipe_suggestions")
    .select("id, status, reviewer_note, recipes (id, title)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load your suggestions: ${error.message}`);
  }

  return data.map(toSuggestion).filter((item) => item !== null);
}

export async function listPendingSuggestions(): Promise<Suggestion[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("recipe_suggestions")
    .select("id, status, reviewer_note, recipes (id, title)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Could not load the moderation queue: ${error.message}`);
  }

  return data.map(toSuggestion).filter((item) => item !== null);
}
