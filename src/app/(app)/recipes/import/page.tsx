import type { Metadata } from "next";

import { Typography } from "@heroui/react";

import { ActionLink } from "@/components/ui/action";
import { RecipeImport } from "@/features/ai/components/recipe-import";
import { PageShell } from "@/components/ui/page-shell";

export const metadata: Metadata = { title: "Import a recipe" };

export default function ImportRecipePage() {
  return (
    <PageShell width="wide">
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
        <ActionLink href="/recipes/new" tier="neutral">
          Enter it manually
        </ActionLink>
      </header>

      <RecipeImport />
    </PageShell>
  );
}
