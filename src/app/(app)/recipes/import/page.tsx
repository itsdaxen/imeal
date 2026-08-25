import type { Metadata } from "next";

import { Typography } from "@heroui/react";

import { RecipeImport } from "@/features/ai/components/recipe-import";

export const metadata: Metadata = { title: "Import a recipe" };

export default function ImportRecipePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 pt-10 sm:pt-14">
      <div className="flex flex-col gap-2">
        <Typography type="h1" weight="semibold">
          Import a recipe
        </Typography>
        <Typography className="text-muted" type="body">
          Paste a recipe from anywhere. You will see what was read from it
          before anything is saved.
        </Typography>
      </div>

      <RecipeImport />
    </main>
  );
}
