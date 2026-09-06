"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { FilterBar } from "@/components/ui/filter-bar";

import { type MealSlot } from "../recipe.schema";
import {
  collectionOptions,
  mealOptions,
} from "@/features/recipes/recipe-filters";

type RecipeSearchProps = {
  archived?: boolean;
  collection?: string;
  collections: string[];
  mealTag?: MealSlot;
  search?: string;
};

export function RecipeSearch({
  archived,
  collection,
  collections,
  mealTag,
  search,
}: RecipeSearchProps) {
  const router = useRouter();
  const [term, setTerm] = useState(search ?? "");
  const [collectionTerm, setCollectionTerm] = useState(collection ?? "");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (term.trim()) params.set("search", term.trim());
      if (mealTag) params.set("mealTag", mealTag);
      if (archived) params.set("archived", "1");
      if (collectionTerm.trim())
        params.set("collection", collectionTerm.trim().toLowerCase());
      router.replace(`/recipes${params.size ? `?${params}` : ""}`, {
        scroll: false,
      });
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [archived, collectionTerm, mealTag, router, term]);

  function routeWithFilters(collection: string, meal: string) {
    if (collection === "shared") {
      router.push("/recipes/shared");
      return;
    }
    const params = new URLSearchParams();
    if (term.trim()) params.set("search", term.trim());
    if (meal !== "any") params.set("mealTag", meal);
    if (collection === "archived") params.set("archived", "1");
    if (collectionTerm.trim())
      params.set("collection", collectionTerm.trim().toLowerCase());
    router.push(`/recipes${params.size ? `?${params}` : ""}`);
  }

  return (
    <FilterBar
      filters={[
        {
          id: "library",
          label: "Library",
          onChange: (value) => routeWithFilters(value, mealTag ?? "any"),
          options: [
            { id: "active", label: "My recipes" },
            { id: "archived", label: "Archived" },
            { id: "shared", label: "Shared with me" },
          ],
          value: archived ? "archived" : "active",
        },
        ...(collections.length > 0
          ? [
              {
                id: "recipeCollection",
                label: "Collection",
                onChange: (value: string) =>
                  setCollectionTerm(value === "any" ? "" : value),
                options: collectionOptions(collections),
                value: collectionTerm || "any",
              },
            ]
          : []),
        {
          id: "mealTag",
          label: "Meal",
          onChange: (value) =>
            routeWithFilters(archived ? "archived" : "active", value),
          options: mealOptions,
          value: mealTag ?? "any",
        },
      ]}
      onSearchChange={setTerm}
      searchLabel="Search recipes"
      searchValue={term}
    />
  );
}
