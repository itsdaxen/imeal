import type { Metadata } from "next";

import { Link, Typography } from "@heroui/react";

import { RecipeForm } from "@/features/recipes/components/recipe-form";
import { createRecipe } from "@/features/recipes/recipe.actions";

export const metadata: Metadata = { title: "Add a recipe" };

export default function NewRecipePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 pt-10 sm:pt-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-2xl flex-col gap-2">
          <Typography type="h1" weight="semibold">
            Add a recipe
          </Typography>
          <Typography className="text-muted" type="body">
            Save a favorite in a format that is easy to plan, shop, and cook.
          </Typography>
        </div>
        <Link href="/recipes/import">Import from pasted text</Link>
      </header>

      <RecipeForm action={createRecipe} submitLabel="Save recipe" />
    </main>
  );
}
