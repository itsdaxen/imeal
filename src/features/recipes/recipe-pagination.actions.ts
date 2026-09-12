"use server";

import { z } from "zod";

import {
  listOwnedRecipePage,
  type RecipeListFilters,
  type RecipePage,
} from "./recipe.queries";
import { listCatalogPage } from "@/features/catalog/catalog.queries";

const mealTag = z.enum(["breakfast", "lunch", "snack", "dinner"]).optional();
const textFilter = z.string().max(200).optional();
const offsetSchema = z.number().int().min(0).max(4_800);
const ownedFiltersSchema = z.object({
  search: textFilter,
  mealTag,
  archived: z.boolean().optional(),
  collection: textFilter,
});
const catalogFiltersSchema = ownedFiltersSchema.omit({ archived: true });

export async function loadOwnedRecipePage(
  filters: RecipeListFilters,
  offset: number,
): Promise<RecipePage> {
  return listOwnedRecipePage(
    ownedFiltersSchema.parse(filters),
    offsetSchema.parse(offset),
  );
}

export async function loadCatalogRecipePage(
  filters: Omit<RecipeListFilters, "archived">,
  offset: number,
): Promise<RecipePage> {
  return listCatalogPage(
    catalogFiltersSchema.parse(filters),
    offsetSchema.parse(offset),
  );
}
