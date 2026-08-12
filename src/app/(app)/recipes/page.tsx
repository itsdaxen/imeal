import type { Metadata } from "next";

import { Link, Typography } from "@heroui/react";

import { RecipeCard } from "@/features/recipes/components/recipe-card";
import { RecipeSearch } from "@/features/recipes/components/recipe-search";
import { listOwnedRecipes } from "@/features/recipes/recipe.queries";
import { MEAL_SLOTS, type MealSlot } from "@/features/recipes/recipe.schema";

export const metadata: Metadata = { title: "Recipes" };

function toMealTag(value: string | undefined): MealSlot | undefined {
  return MEAL_SLOTS.find((slot) => slot === value);
}

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; mealTag?: string }>;
}) {
  const { search, mealTag } = await searchParams;
  const filters = { search, mealTag: toMealTag(mealTag) };
  const recipes = await listOwnedRecipes(filters);
  const isFiltered = Boolean(filters.search || filters.mealTag);

  return (
    <main className="flex flex-col gap-8 pt-10 sm:pt-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <Typography type="h1" weight="semibold">
          Recipes
        </Typography>
        <Link href="/recipes/new">Add a recipe</Link>
      </header>

      <RecipeSearch mealTag={filters.mealTag} search={filters.search} />

      {recipes.length === 0 ? (
        <Typography className="text-muted" type="body">
          {isFiltered
            ? "No recipes match that search."
            : "No recipes yet. Add the first one you actually want to cook."}
        </Typography>
      ) : (
        <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <RecipeCard recipe={recipe} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
