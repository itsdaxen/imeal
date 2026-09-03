import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { MealSlot } from "@/features/recipes/recipe.schema";

export type CatalogRecipe = {
  id: string;
  title: string;
  prepMinutes: number;
  servings: number;
  mealTags: MealSlot[];
  collectionTags: string[];
  imageUrl: string | null;
};

export type Suggestion = {
  createdAt: string;
  id: string;
  status: "pending" | "approved" | "rejected";
  reviewerNote: string | null;
  recipe: { id: string; imageUrl: string | null; title: string };
};

export type ModerationSuggestion = {
  id: string;
  author: string;
  recipe: {
    id: string;
    title: string;
    ingredients: string[];
    steps: string[];
    tip: string | null;
    prepMinutes: number;
    servings: number;
    mealTags: MealSlot[];
    imageUrl: string | null;
  };
};

export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("is_admin");

  return !error && Boolean(data);
}

/** The collections in use across the published catalog. */
export async function listCatalogCollections(): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("collection_tags")
    .eq("visibility", "public")
    .eq("status", "active");

  if (error) {
    return [];
  }

  return [...new Set(data.flatMap((row) => row.collection_tags))].sort();
}

export async function listCatalog(
  filters: {
    search?: string;
    mealTag?: MealSlot;
    collection?: string;
  } = {},
): Promise<CatalogRecipe[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("recipes")
    .select(
      "id, title, prep_minutes, servings, meal_tags, collection_tags, image_url",
    )
    .eq("visibility", "public")
    .eq("status", "active")
    .order("title", { ascending: true });

  const term = filters.search?.trim();

  if (term) {
    query = query.ilike(
      "title",
      `%${term.replace(/[%_\\]/g, (m) => `\\${m}`)}%`,
    );
  }

  if (filters.mealTag) query = query.contains("meal_tags", [filters.mealTag]);
  if (filters.collection?.trim()) {
    query = query.contains("collection_tags", [filters.collection.trim()]);
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
    collectionTags: recipe.collection_tags,
    imageUrl: recipe.image_url,
  }));
}

function toSuggestion(row: {
  created_at: string;
  id: string;
  status: "pending" | "approved" | "rejected";
  reviewer_note: string | null;
  recipes: { id: string; image_url: string | null; title: string } | null;
}): Suggestion | null {
  return row.recipes
    ? {
        createdAt: row.created_at,
        id: row.id,
        status: row.status,
        reviewerNote: row.reviewer_note,
        recipe: {
          id: row.recipes.id,
          imageUrl: row.recipes.image_url,
          title: row.recipes.title,
        },
      }
    : null;
}

export async function listMySuggestions(): Promise<Suggestion[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("recipe_suggestions")
    .select(
      "id, created_at, status, reviewer_note, recipes (id, title, image_url)",
    )
    .eq("suggested_by", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load your suggestions: ${error.message}`);
  }

  return data.map(toSuggestion).filter((item) => item !== null);
}

export async function listPendingSuggestions(): Promise<
  ModerationSuggestion[]
> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("recipe_suggestions")
    .select(
      `id,
       author:profiles!recipe_suggestions_suggested_by_fkey (display_name),
       recipes (id, title, ingredients, steps, tip, prep_minutes, servings, meal_tags, image_url)`,
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Could not load the moderation queue: ${error.message}`);
  }

  return data
    .filter((row) => row.recipes !== null)
    .map((row) => ({
      id: row.id,
      author: row.author?.display_name?.trim() || "A cook",
      recipe: {
        id: row.recipes.id,
        title: row.recipes.title,
        ingredients: row.recipes.ingredients,
        steps: row.recipes.steps,
        tip: row.recipes.tip,
        prepMinutes: row.recipes.prep_minutes,
        servings: row.recipes.servings,
        mealTags: row.recipes.meal_tags,
        imageUrl: row.recipes.image_url,
      },
    }));
}
