import type { Metadata } from "next";

import { Link, Typography } from "@heroui/react";

import { RecipeImport } from "@/features/ai/components/recipe-import";

export const metadata: Metadata = { title: "Import a recipe" };

export default function ImportRecipePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 pt-10 sm:pt-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-2xl flex-col gap-2">
          <Typography type="h1" weight="semibold">
            Import a recipe
          </Typography>
          <Typography className="text-muted" type="body">
            Paste a recipe from anywhere. You will review what iMeal reads
            before anything is saved.
          </Typography>
        </div>
        <Link href="/recipes/new">Enter it manually</Link>
      </header>

      <RecipeImport />
    </main>
  );
}
