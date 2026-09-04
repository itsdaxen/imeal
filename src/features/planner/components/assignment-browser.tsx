"use client";

import { useMemo, useState } from "react";
import { SearchX } from "lucide-react";

import { ActionButton } from "@/components/ui/action";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { RecipeCard } from "@/features/recipes/components/recipe-card";
import type { RecipeSummary } from "@/features/recipes/recipe.queries";
import type { MealSlot } from "@/features/recipes/recipe.schema";

import { assignRecipeToSlot } from "../plan.actions";

/**
 * The same card and grid as the library, so choosing a meal looks like browsing
 * recipes rather than a separate chooser. Filtering is local: the slot has already
 * narrowed the list, so a round trip per keystroke would cost more than it returns.
 */
export function AssignmentBrowser({
  dayIndex,
  mealSlot,
  recipes,
  weekStart,
}: {
  dayIndex: number;
  mealSlot: MealSlot;
  recipes: RecipeSummary[];
  weekStart: string;
}) {
  const [term, setTerm] = useState("");
  const [collection, setCollection] = useState("any");

  const collections = useMemo(
    () =>
      [...new Set(recipes.flatMap((recipe) => recipe.collection_tags))].sort(),
    [recipes],
  );

  const shown = useMemo(() => {
    const needle = term.trim().toLocaleLowerCase();

    return recipes.filter((recipe) => {
      const matchesTerm =
        !needle || recipe.title.toLocaleLowerCase().includes(needle);
      const matchesCollection =
        collection === "any" || recipe.collection_tags.includes(collection);

      return matchesTerm && matchesCollection;
    });
  }, [collection, recipes, term]);

  return (
    <section aria-label="Choose a recipe" className="flex flex-col gap-5">
      <FilterBar
        filters={
          collections.length > 0
            ? [
                {
                  id: "assignCollection",
                  label: "Collection",
                  onChange: setCollection,
                  options: [
                    { id: "any", label: "Any collection" },
                    ...collections.map((name) => ({ id: name, label: name })),
                  ],
                  value: collection,
                },
              ]
            : []
        }
        onSearchChange={setTerm}
        searchLabel="Search your recipes"
        searchValue={term}
      />

      {shown.length === 0 ? (
        <EmptyState
          actions={
            <ActionButton
              onPress={() => {
                setTerm("");
                setCollection("any");
              }}
              tier="neutral"
            >
              Clear the filters
            </ActionButton>
          }
          description={`None of your ${mealSlot} recipes match that search.`}
          icon={<SearchX aria-hidden="true" className="size-6" />}
          title="No recipes match"
        />
      ) : (
        <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((recipe) => (
            <li className="flex flex-col gap-2" key={recipe.id}>
              <RecipeCard recipe={recipe} />

              <form action={assignRecipeToSlot}>
                <input name="weekStart" type="hidden" value={weekStart} />
                <input name="dayIndex" type="hidden" value={dayIndex} />
                <input name="slot" type="hidden" value={mealSlot} />
                <input name="recipeId" type="hidden" value={recipe.id} />
                {/* One per card, so these stay neutral: a grid of identical
                    primaries is a wall of green and leaves the page with no
                    single primary action at all. */}
                <ActionButton className="w-full" tier="neutral" type="submit">
                  Add to plan
                </ActionButton>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
