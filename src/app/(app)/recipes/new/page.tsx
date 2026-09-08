import type { Metadata } from "next";

import { ActionLink } from "@/components/ui/action";
import { listOwnedCollections } from "@/features/recipes/recipe.queries";
import { RecipeForm } from "@/features/recipes/components/recipe-form";
import { createRecipe } from "@/features/recipes/recipe.actions";
import { PageShell } from "@/components/ui/page-shell";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Add a recipe" };

export default async function NewRecipePage() {
  const knownCollections = await listOwnedCollections();

  return (
    <PageShell width="wide">
      <PageHeader
        actions={
          <ActionLink href="/recipes/import" tier="neutral">
            Import from pasted text
          </ActionLink>
        }
        title={<>Add a recipe</>}
      />

      <RecipeForm
        action={createRecipe}
        knownCollections={knownCollections}
        submitLabel="Save recipe"
      />
    </PageShell>
  );
}
