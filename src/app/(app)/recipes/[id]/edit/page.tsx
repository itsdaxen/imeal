import type { Metadata } from "next";

import { notFound } from "next/navigation";

import { ActionLink } from "@/components/ui/action";
import { RecipeForm } from "@/features/recipes/components/recipe-form";
import { getCurrentUser } from "@/features/auth/current-user";
import { updateRecipe } from "@/features/recipes/recipe.actions";
import {
  getRecipe,
  listOwnedCollections,
} from "@/features/recipes/recipe.queries";
import { isCurrentUserAdmin } from "@/features/catalog/catalog.queries";
import { PageShell } from "@/components/ui/page-shell";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Edit recipe" };

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [recipe, user, isAdmin, knownCollections] = await Promise.all([
    getRecipe(id),
    getCurrentUser(),
    isCurrentUserAdmin(),
    listOwnedCollections(),
  ]);

  // Your own recipe, or a catalog entry you moderate. Anything else is a 404.
  const mayEdit =
    Boolean(recipe && user && recipe.owner_id === user.id) ||
    Boolean(recipe && isAdmin && recipe.visibility === "public");

  if (!recipe || !mayEdit) {
    notFound();
  }

  const updateThisRecipe = updateRecipe.bind(null, recipe.id);

  return (
    <PageShell width="wide">
      <PageHeader
        actions={
          <ActionLink href={`/recipes/${recipe.id}`} tier="quiet">
            Back to recipe
          </ActionLink>
        }
        description={<>Keep the version you plan and cook accurate.</>}
        title={<>Edit recipe</>}
      />

      <RecipeForm
        action={updateThisRecipe}
        knownCollections={knownCollections}
        submitLabel="Save changes"
        values={{
          imageUrl: recipe.image_url,
          title: recipe.title,
          ingredients: recipe.ingredients.join("\n"),
          steps: recipe.steps.join("\n"),
          tip: recipe.tip ?? "",
          prepMinutes: recipe.prep_minutes,
          servings: recipe.servings,
          mealTags: recipe.meal_tags,
          collectionTags: recipe.collection_tags,
        }}
      />
    </PageShell>
  );
}
