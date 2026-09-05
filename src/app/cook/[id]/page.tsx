import type { Metadata } from "next";

import { notFound } from "next/navigation";

import { BackLink } from "@/components/ui/back-link";

import { CookingSession } from "@/features/cooking/components/cooking-session";
import { getRecipe } from "@/features/recipes/recipe.queries";
import { PageHeader } from "@/components/ui/page-header";

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
      <PageHeader
        back={
          <BackLink href={`/recipes/${recipe.id}`}>Leave cooking mode</BackLink>
        }
        description={
          <>
            {recipe.prep_minutes} min · serves {recipe.servings}
          </>
        }
        title={recipe.title}
      />

      <CookingSession
        ingredients={recipe.ingredients}
        steps={recipe.steps}
        tip={recipe.tip}
      />
    </main>
  );
}
