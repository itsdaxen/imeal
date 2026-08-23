import type { Metadata } from "next";

import Image from "next/image";
import { notFound } from "next/navigation";
import { Link, Typography } from "@heroui/react";

import { TagList } from "@/components/ui/tag-list";
import { getCurrentUser } from "@/features/auth/current-user";
import { listFriends } from "@/features/friends/friend.queries";
import { DeleteRecipeForm } from "@/features/recipes/components/delete-recipe-form";
import { archiveRecipe } from "@/features/recipes/recipe.actions";
import { isCurrentUserAdmin } from "@/features/catalog/catalog.queries";
import { Button } from "@heroui/react";
import { getRecipe } from "@/features/recipes/recipe.queries";
import { SuggestForm } from "@/features/catalog/components/suggest-form";
import { listMySuggestions } from "@/features/catalog/catalog.queries";
import { SharePanel } from "@/features/sharing/components/share-panel";
import { listShareRecipients } from "@/features/sharing/sharing.queries";

type RecipePageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: RecipePageProps): Promise<Metadata> {
  const { id } = await params;
  const recipe = await getRecipe(id);

  return { title: recipe?.title ?? "Recipe" };
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { id } = await params;
  const [recipe, user, isAdmin] = await Promise.all([
    getRecipe(id),
    getCurrentUser(),
    isCurrentUserAdmin(),
  ]);

  if (!recipe) {
    notFound();
  }

  // A shared recipe is readable but not the recipient's to change.
  const isOwner = Boolean(user && recipe.owner_id === user.id);
  const [friends, recipientIds, suggestions] = isOwner
    ? await Promise.all([
        listFriends(),
        listShareRecipients(recipe.id),
        listMySuggestions(),
      ])
    : [[], [], []];
  const suggestion = suggestions.find((item) => item.recipe.id === recipe.id);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 pt-10 sm:pt-14">
      {recipe.image_url ? (
        <Image
          alt=""
          className="aspect-video w-full rounded-3xl object-cover"
          height={420}
          priority
          sizes="(min-width: 768px) 48rem, 100vw"
          src={recipe.image_url}
          width={768}
        />
      ) : null}

      <header className="flex flex-col gap-3">
        <TagList label="Meals this suits" tags={recipe.meal_tags} />
        <Typography type="h1" weight="semibold">
          {recipe.title}
        </Typography>
        <Typography className="text-muted" type="body-sm">
          {recipe.prep_minutes} min · serves {recipe.servings}
        </Typography>

        <div className="flex items-center gap-4">
          <Link href={`/cook/${recipe.id}`}>Cook this</Link>
          {isOwner ? (
            <>
              <Link href={`/recipes/${recipe.id}/edit`}>Edit</Link>

              <form action={archiveRecipe}>
                <input name="recipeId" type="hidden" value={recipe.id} />
                <Button size="sm" type="submit" variant="ghost">
                  Archive
                </Button>
              </form>

              <DeleteRecipeForm id={recipe.id} />
            </>
          ) : isAdmin ? (
            <Link href={`/recipes/${recipe.id}/edit`}>Edit as moderator</Link>
          ) : (
            <span className="text-sm text-muted">Shared with you</span>
          )}
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <Typography type="h2" weight="semibold">
          Ingredients
        </Typography>
        <ul className="flex flex-col gap-1.5 pl-5">
          {recipe.ingredients.map((ingredient) => (
            <li key={ingredient}>{ingredient}</li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <Typography type="h2" weight="semibold">
          Steps
        </Typography>
        <ol className="flex flex-col gap-3 pl-5">
          {recipe.steps.map((step, index) => (
            <li key={`${index}-${step.slice(0, 24)}`}>{step}</li>
          ))}
        </ol>
      </section>

      {recipe.tip ? (
        <section className="flex flex-col gap-2">
          <Typography type="h2" weight="semibold">
            Tip
          </Typography>
          <Typography type="body">{recipe.tip}</Typography>
        </section>
      ) : null}
      {isOwner ? (
        <section className="flex flex-col gap-3 border-t border-border/60 pt-6">
          <Typography type="h2" weight="semibold">
            The catalog
          </Typography>
          <SuggestForm recipeId={recipe.id} suggestion={suggestion} />
        </section>
      ) : null}

      {isOwner ? (
        <SharePanel
          friends={friends}
          recipeId={recipe.id}
          recipientIds={recipientIds}
        />
      ) : null}
    </main>
  );
}
