import type { Metadata } from "next";

import { Button, Typography } from "@heroui/react";

import { RecipeCard } from "@/features/recipes/components/recipe-card";
import { RecipeSearch } from "@/features/recipes/components/recipe-search";
import {
  listOwnedCollections,
  listOwnedRecipes,
} from "@/features/recipes/recipe.queries";
import { restoreRecipe } from "@/features/recipes/recipe.actions";
import { BookOpen, SearchX } from "lucide-react";

import { ActionLink } from "@/components/ui/action";
import { EmptyState } from "@/components/ui/empty-state";
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
    collection?: string;
  }>;
}) {
  const { search, mealTag, archived, collection } = await searchParams;
  const showArchived = archived === "1";
  const filters = {
    search,
    mealTag: toMealTag(mealTag),
    archived: showArchived,
    collection,
  };
  const [recipes, collections] = await Promise.all([
    listOwnedRecipes(filters),
    listOwnedCollections(),
  ]);
  const isFiltered = Boolean(filters.search || filters.mealTag || collection);

  return (
    <main className="flex flex-col gap-8 pt-10 sm:pt-14">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <Typography type="h1" weight="semibold">
          {showArchived ? "Archived recipes" : "Recipes"}
        </Typography>
        <nav
          aria-label="Recipe collection actions"
          className="flex flex-wrap items-center gap-x-2 gap-y-1"
        >
          <ActionLink href="/recipes/import" tier="neutral">
            Import
          </ActionLink>
          <ActionLink
            className="order-first sm:order-none"
            href="/recipes/new"
            tier="primary"
          >
            Add a recipe
          </ActionLink>
        </nav>
      </header>

      <RecipeSearch
        archived={showArchived}
        collection={collection}
        collections={collections}
        mealTag={filters.mealTag}
        search={filters.search}
      />

      {recipes.length === 0 ? (
        <EmptyState
          actions={
            isFiltered ? (
              <ActionLink href="/recipes" tier="neutral">
                Clear the filters
              </ActionLink>
            ) : showArchived ? (
              <ActionLink href="/recipes" tier="neutral">
                Back to your recipes
              </ActionLink>
            ) : (
              <>
                <ActionLink href="/recipes/new" tier="neutral">
                  Add a recipe
                </ActionLink>
                <ActionLink href="/recipes/import" tier="quiet">
                  Import from text
                </ActionLink>
              </>
            )
          }
          description={
            showArchived
              ? "Recipes you archive are kept here, out of the way but not deleted."
              : isFiltered
                ? "Nothing in your collection matches that search yet."
                : "Start with something you already cook often. You can paste it in rather than typing it out."
          }
          icon={
            isFiltered ? (
              <SearchX aria-hidden="true" className="size-6" />
            ) : (
              <BookOpen aria-hidden="true" className="size-6" />
            )
          }
          title={
            showArchived
              ? "Nothing archived"
              : isFiltered
                ? "No recipes match"
                : "Your cookbook is empty"
          }
        />
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
