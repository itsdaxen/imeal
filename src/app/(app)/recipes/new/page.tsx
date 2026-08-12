import type { Metadata } from "next";

import { Typography } from "@heroui/react";

import { RecipeForm } from "@/features/recipes/components/recipe-form";
import { createRecipe } from "@/features/recipes/recipe.actions";

export const metadata: Metadata = { title: "Add a recipe" };

export default function NewRecipePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 pt-10 sm:pt-14">
      <Typography type="h1" weight="semibold">
        Add a recipe
      </Typography>

      <RecipeForm action={createRecipe} submitLabel="Save recipe" />
    </main>
  );
}
