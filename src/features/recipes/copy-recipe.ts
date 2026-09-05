import "server-only";

import type { SupabaseServerClient } from "@/lib/supabase/server";

import type { MealSlot } from "./recipe.schema";

export type RecipeSource = {
  collection_tags: string[];
  image_url: string | null;
  ingredients: string[];
  meal_tags: MealSlot[];
  prep_minutes: number;
  servings: number;
  steps: string[];
  tip: string | null;
  title: string;
};

/**
 * Takes a copy of someone else's recipe into your own library.
 *
 * The catalog and a friend's share both do this, and both wrote the field list out by
 * hand — with different omissions. Saving from the catalog silently dropped the
 * photograph; copying from a friend silently dropped the collections. Neither was a
 * decision, and neither surfaced as an error: you only noticed later, looking at your
 * own copy. One list, so there is nothing left to disagree about.
 *
 * `source_recipe_id` records where it came from, which is what lets a second save find
 * the copy you already have instead of making another.
 */
export async function copyRecipeInto(
  supabase: SupabaseServerClient,
  userId: string,
  sourceId: string,
  source: RecipeSource,
) {
  return supabase
    .from("recipes")
    .insert({
      collection_tags: source.collection_tags,
      image_url: source.image_url,
      ingredients: source.ingredients,
      meal_tags: source.meal_tags,
      owner_id: userId,
      prep_minutes: source.prep_minutes,
      servings: source.servings,
      source_recipe_id: sourceId,
      steps: source.steps,
      tip: source.tip,
      title: source.title,
    })
    .select("id")
    .single();
}
