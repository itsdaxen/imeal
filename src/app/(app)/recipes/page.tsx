import type { Metadata } from "next";

import { Link, Typography } from "@heroui/react";

import { RecipeCard } from "@/features/recipes/components/recipe-card";
import { RecipeSearch } from "@/features/recipes/components/recipe-search";
import { listOwnedRecipes } from "@/features/recipes/recipe.queries";
import { restoreRecipe } from "@/features/recipes/recipe.actions";
import { Button } from "@heroui/react";
import { MEAL_SLOTS, type MealSlot } from "@/features/recipes/recipe.schema";

export const metadata: Metadata = { title: "Recipes" };

function toMealTag(value: string | undefined): MealSlot | undefined {
  return MEAL_SLOTS.find((slot) => slot === value);
}

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    mealTag?: string;
    archived?: string;
  }>;
}) {
  const { search, mealTag, archived } = await searchParams;
  const showArchived = archived === "1";
  const filters = {
    search,
    mealTag: toMealTag(mealTag),
    archived: showArchived,
  };
  const recipes = await listOwnedRecipes(filters);
  const isFiltered = Boolean(filters.search || filters.mealTag);

  return (
    <main className="flex flex-col gap-8 pt-10 sm:pt-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <Typography type="h1" weight="semibold">
          {showArchived ? "Archived recipes" : "Recipes"}
        </Typography>
        <div className="flex items-center gap-4">
          <Link href={showArchived ? "/recipes" : "/recipes?archived=1"}>
            {showArchived ? "Back to your recipes" : "Archived"}
          </Link>
          <Link href="/recipes/shared">Shared with you</Link>
          <Link href="/recipes/import">Import</Link>
          <Link href="/recipes/new">Add a recipe</Link>
        </div>
      </header>

      <RecipeSearch mealTag={filters.mealTag} search={filters.search} />

      {recipes.length === 0 ? (
        <Typography className="text-muted" type="body">
          {showArchived
            ? "Nothing archived."
            : isFiltered
              ? "No recipes match that search."
              : "No recipes yet. Add the first one you actually want to cook."}
        </Typography>
      ) : (
        <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <li className="flex flex-col gap-2" key={recipe.id}>
              <RecipeCard recipe={recipe} />

              {showArchived ? (
                <form action={restoreRecipe}>
                  <input name="recipeId" type="hidden" value={recipe.id} />
                  <Button size="sm" type="submit" variant="tertiary">
                    Restore
                  </Button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
