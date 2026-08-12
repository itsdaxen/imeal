import type { Metadata } from "next";

import { notFound } from "next/navigation";
import { Typography } from "@heroui/react";

import { RecipeForm } from "@/features/recipes/components/recipe-form";
import { getCurrentUser } from "@/features/auth/current-user";
import { updateRecipe } from "@/features/recipes/recipe.actions";
import { getRecipe } from "@/features/recipes/recipe.queries";

export const metadata: Metadata = { title: "Edit recipe" };

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [recipe, user] = await Promise.all([getRecipe(id), getCurrentUser()]);

  // A catalog recipe is readable but not editable, so absence of ownership is a 404.
  if (!recipe || !user || recipe.owner_id !== user.id) {
    notFound();
  }

  const updateThisRecipe = updateRecipe.bind(null, recipe.id);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 pt-10 sm:pt-14">
      <Typography type="h1" weight="semibold">
        Edit recipe
      </Typography>

      <RecipeForm
        action={updateThisRecipe}
        submitLabel="Save changes"
        values={{
          title: recipe.title,
          ingredients: recipe.ingredients.join("\n"),
          steps: recipe.steps.join("\n"),
          tip: recipe.tip ?? "",
          prepMinutes: recipe.prep_minutes,
          servings: recipe.servings,
          mealTags: recipe.meal_tags,
        }}
      />
    </main>
  );
}
