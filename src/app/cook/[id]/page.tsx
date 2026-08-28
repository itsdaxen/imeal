import type { Metadata } from "next";

import { notFound } from "next/navigation";
import { Link, Typography } from "@heroui/react";

import { CookingSession } from "@/features/cooking/components/cooking-session";
import { getRecipe } from "@/features/recipes/recipe.queries";

type CookPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: CookPageProps): Promise<Metadata> {
  const { id } = await params;
  const recipe = await getRecipe(id);

  return { title: recipe ? `Cooking ${recipe.title}` : "Cooking" };
}

export default async function CookPage({ params }: CookPageProps) {
  const { id } = await params;
  const recipe = await getRecipe(id);

  if (!recipe) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
      <header className="flex flex-col gap-2">
        <Link
          className="inline-flex min-h-11 items-center text-sm"
          href={`/recipes/${recipe.id}`}
        >
          Leave cooking mode
        </Link>
        <Typography type="h1" weight="semibold">
          {recipe.title}
        </Typography>
        <Typography className="text-muted" type="body-sm">
          {recipe.prep_minutes} min · serves {recipe.servings}
        </Typography>
      </header>

      <CookingSession
        ingredients={recipe.ingredients}
        steps={recipe.steps}
        tip={recipe.tip}
      />
    </main>
  );
}
