import type { Metadata } from "next";

import { Button, Typography } from "@heroui/react";

import { RecipeCard } from "@/features/recipes/components/recipe-card";
import { RecipeSearch } from "@/features/recipes/components/recipe-search";
import { listOwnedRecipes } from "@/features/recipes/recipe.queries";
import { restoreRecipe } from "@/features/recipes/recipe.actions";
import { ActionLink } from "@/components/ui/action";
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
        <div className="flex flex-wrap items-center gap-4">
          <ActionLink
            href={showArchived ? "/recipes" : "/recipes?archived=1"}
            tier="quiet"
          >
            {showArchived ? "Back to your recipes" : "Archived"}
          </ActionLink>
          <ActionLink href="/recipes/shared" tier="quiet">
            Shared with you
          </ActionLink>
          <ActionLink href="/recipes/import" tier="neutral">
            Import
          </ActionLink>
          <ActionLink href="/recipes/new" tier="primary">
            Add a recipe
          </ActionLink>
        </div>
      </header>

      <RecipeSearch mealTag={filters.mealTag} search={filters.search} />

      {recipes.length === 0 ? (
        <Typography color="muted" type="body">
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
                  <Button className="min-h-11" type="submit" variant="tertiary">
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
