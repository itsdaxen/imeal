import type { Metadata } from "next";

import { ActionLink } from "@/components/ui/action";
import { RecipeImport } from "@/features/ai/components/recipe-import";
import { PageShell } from "@/components/ui/page-shell";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Import a recipe" };

export default function ImportRecipePage() {
  return (
    <PageShell width="wide">
      <PageHeader
        actions={
          <ActionLink href="/recipes/new" tier="neutral">
            Enter it manually
          </ActionLink>
        }
        description={
          <>
            Paste a recipe from anywhere. You will review what iMeal reads
            before anything is saved.
          </>
        }
        title={<>Import a recipe</>}
      />

      <RecipeImport />
    </PageShell>
  );
}
