import type { Metadata } from "next";

import { Typography } from "@heroui/react";
import { BookOpen, SearchX } from "lucide-react";

import { ActionLink } from "@/components/ui/action";
import { EmptyState } from "@/components/ui/empty-state";
import { PageShell } from "@/components/ui/page-shell";
import { InfiniteRecipeGrid } from "@/features/recipes/components/infinite-recipe-grid";
import { RecipeSearch } from "@/features/recipes/components/recipe-search";
import { loadOwnedRecipePage } from "@/features/recipes/recipe-pagination.actions";
import {
  listOwnedCollections,
  listOwnedRecipePage,
} from "@/features/recipes/recipe.queries";
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
  const [recipePage, collections] = await Promise.all([
    listOwnedRecipePage(filters),
    listOwnedCollections(),
  ]);
  const isFiltered = Boolean(filters.search || filters.mealTag || collection);

  return (
    <PageShell>
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

      {recipePage.recipes.length === 0 ? (
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
          // An empty cookbook says so in the heading, and the two buttons below say
          // what to do about it. A sentence between them only delays reading either.
          description={
            showArchived
              ? "Recipes you archive are kept here, out of the way but not deleted."
              : isFiltered
                ? "Nothing in your collection matches that search yet."
                : undefined
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
        <InfiniteRecipeGrid
          initialPage={recipePage}
          key={JSON.stringify(filters)}
          loadPage={loadOwnedRecipePage.bind(null, filters)}
          restoreArchived={showArchived}
        />
      )}
    </PageShell>
  );
}
