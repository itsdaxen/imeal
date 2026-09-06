"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { FilterBar } from "@/components/ui/filter-bar";
import { type MealSlot } from "@/features/recipes/recipe.schema";
import {
  collectionOptions,
  mealOptions,
} from "@/features/recipes/recipe-filters";

export function CatalogSearch({
  collections,
  search,
  mealTag,
  collection,
}: {
  collections: string[];
  search?: string;
  mealTag?: MealSlot;
  collection?: string;
}) {
  const router = useRouter();
  const [term, setTerm] = useState(search ?? "");

  function navigate(nextMeal = mealTag, nextCollection = collection) {
    const params = new URLSearchParams();
    if (term.trim()) params.set("search", term.trim());
    if (nextMeal) params.set("mealTag", nextMeal);
    if (nextCollection) params.set("collection", nextCollection);
    router.replace(`/catalog${params.size ? `?${params}` : ""}`, {
      scroll: false,
    });
  }

  useEffect(() => {
    if (term.trim() === (search ?? "").trim()) {
      return;
    }

    const timeout = window.setTimeout(() => navigate(), 250);
    return () => window.clearTimeout(timeout);
    // Only the text field debounces; the selects navigate on change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  return (
    <FilterBar
      filters={[
        {
          id: "catalogMeal",
          label: "Meal",
          onChange: (value) =>
            navigate(value === "any" ? undefined : (value as MealSlot)),
          options: mealOptions,
          value: mealTag ?? "any",
        },
        ...(collections.length > 0
          ? [
              {
                id: "catalogCollection",
                label: "Collection",
                onChange: (value: string) =>
                  navigate(mealTag, value === "any" ? undefined : value),
                options: collectionOptions(collections),
                value: collection ?? "any",
              },
            ]
          : []),
      ]}
      onSearchChange={setTerm}
      searchLabel="Search the catalog"
      searchValue={term}
    />
  );
}
