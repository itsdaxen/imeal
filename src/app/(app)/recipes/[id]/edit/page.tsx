import type { Metadata } from "next";

import { notFound } from "next/navigation";
import { Typography } from "@heroui/react";

import { ActionLink } from "@/components/ui/action";
import { RecipeForm } from "@/features/recipes/components/recipe-form";
import { getCurrentUser } from "@/features/auth/current-user";
import { updateRecipe } from "@/features/recipes/recipe.actions";
import { getRecipe } from "@/features/recipes/recipe.queries";
import { isCurrentUserAdmin } from "@/features/catalog/catalog.queries";

export const metadata: Metadata = { title: "Edit recipe" };

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [recipe, user, isAdmin] = await Promise.all([
    getRecipe(id),
    getCurrentUser(),
    isCurrentUserAdmin(),
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
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 pt-10 sm:pt-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-2xl flex-col gap-2">
          <Typography type="h1" weight="semibold">
            Edit recipe
          </Typography>
          <Typography className="text-muted" type="body">
            Keep the version you plan and cook accurate.
          </Typography>
        </div>
        <ActionLink href={`/recipes/${recipe.id}`} tier="quiet">
          Back to recipe
        </ActionLink>
      </header>

      <RecipeForm
        action={updateThisRecipe}
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
    </main>
  );
}
