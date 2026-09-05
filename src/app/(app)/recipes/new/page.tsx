import type { Metadata } from "next";

import { Typography } from "@heroui/react";

import { ActionLink } from "@/components/ui/action";
import { listOwnedCollections } from "@/features/recipes/recipe.queries";
import { RecipeForm } from "@/features/recipes/components/recipe-form";
import { createRecipe } from "@/features/recipes/recipe.actions";
import { PageShell } from "@/components/ui/page-shell";

export const metadata: Metadata = { title: "Add a recipe" };

export default async function NewRecipePage() {
  const knownCollections = await listOwnedCollections();

  return (
    <PageShell width="wide">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-2xl flex-col gap-2">
          <Typography type="h1" weight="semibold">
            Add a recipe
          </Typography>
          <Typography className="text-muted" type="body">
            Save a favorite in a format that is easy to plan, shop, and cook.
          </Typography>
        </div>
        <ActionLink href="/recipes/import" tier="neutral">
          Import from pasted text
        </ActionLink>
      </header>

      <RecipeForm
        action={createRecipe}
        knownCollections={knownCollections}
        submitLabel="Save recipe"
      />
    </PageShell>
  );
}
