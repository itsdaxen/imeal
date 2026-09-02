import type { Metadata } from "next";

import Image from "next/image";
import { notFound } from "next/navigation";
import { Card, Typography } from "@heroui/react";

import { SectionTitle } from "@/components/ui/section-title";
import { ActionLink } from "@/components/ui/action";
import { ContentCard } from "@/components/ui/content-card";
import { artworkFor, MealArtwork } from "@/components/ui/meal-artwork";
import { TagList } from "@/components/ui/tag-list";
import { getCurrentUser } from "@/features/auth/current-user";
import { listFriends } from "@/features/friends/friend.queries";
import { RecipeOwnerMenu } from "@/features/recipes/components/recipe-owner-menu";
import { isCurrentUserAdmin } from "@/features/catalog/catalog.queries";
import { saveCatalogRecipe } from "@/features/catalog/catalog.actions";
import { Button } from "@heroui/react";
import { getRecipe } from "@/features/recipes/recipe.queries";
import { SuggestForm } from "@/features/catalog/components/suggest-form";
import { listMySuggestions } from "@/features/catalog/catalog.queries";
import { SharePanel } from "@/features/sharing/components/share-panel";
import { listShareRecipients } from "@/features/sharing/sharing.queries";
import { copySharedRecipe } from "@/features/sharing/sharing.actions";
import { PlanRecipeDialog } from "@/features/planner/components/plan-recipe-dialog";
import { currentWeekStart, weekDays } from "@/features/planner/week";

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
  const isCatalogRecipe = recipe.owner_id === null;
  const [friends, recipientIds, suggestions] = isOwner
    ? await Promise.all([
        listFriends(),
        listShareRecipients(recipe.id),
        listMySuggestions(),
      ])
    : [[], [], []];
  const suggestion = suggestions.find((item) => item.recipe.id === recipe.id);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 pt-10 sm:pt-14">
      <ContentCard
        appearance="media"
        className="relative grid md:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]"
        density="flush"
      >
        {isOwner ? <RecipeOwnerMenu id={recipe.id} /> : null}
        <Card.Content className="min-h-64 flex-none p-0 md:min-h-[30rem]">
          {recipe.image_url ? (
            <Image
              alt=""
              className="size-full object-cover"
              height={640}
              preload
              sizes="(min-width: 768px) 34rem, 100vw"
              src={recipe.image_url}
              width={720}
            />
          ) : (
            <MealArtwork
              artwork={artworkFor(recipe.id)}
              className="size-full"
            />
          )}
        </Card.Content>

        <Card.Header className="flex-col items-start justify-center gap-5 p-6 sm:p-8 lg:p-10">
          <TagList label="Meals this suits" tags={recipe.meal_tags} />
          <Typography type="h1" weight="semibold">
            {recipe.title}
          </Typography>
          <Typography className="text-muted" type="body-sm">
            {recipe.prep_minutes} min · serves {recipe.servings}
          </Typography>

          <div className="flex flex-wrap items-center gap-3">
            {isOwner ? (
              <PlanRecipeDialog
                days={weekDays(currentWeekStart())}
                recipeId={recipe.id}
                slots={recipe.meal_tags}
                weekStart={currentWeekStart()}
              />
            ) : null}
            <ActionLink
              href={`/cook/${recipe.id}`}
              tier={isOwner ? "neutral" : "primary"}
            >
              Cook this
            </ActionLink>
            {isOwner ? null : isCatalogRecipe && isAdmin ? (
              <ActionLink href={`/recipes/${recipe.id}/edit`} tier="neutral">
                Edit as moderator
              </ActionLink>
            ) : isCatalogRecipe ? (
              <form action={saveCatalogRecipe}>
                <input name="recipeId" type="hidden" value={recipe.id} />
                <Button className="min-h-11" type="submit" variant="tertiary">
                  Save a copy
                </Button>
              </form>
            ) : (
              <form action={copySharedRecipe}>
                <input name="recipeId" type="hidden" value={recipe.id} />
                <Button className="min-h-11" type="submit" variant="tertiary">
                  Save a copy
                </Button>
              </form>
            )}
          </div>
        </Card.Header>
      </ContentCard>

      <div className="grid gap-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-12">
        <ContentCard density="spacious">
          <SectionTitle>Ingredients</SectionTitle>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-muted">
            {recipe.ingredients.map((ingredient) => (
              <li key={ingredient}>{ingredient}</li>
            ))}
          </ul>
        </ContentCard>

        <section className="flex flex-col gap-4 p-1 sm:p-2">
          <SectionTitle>Steps</SectionTitle>
          <ol className="flex list-none flex-col gap-5 p-0">
            {recipe.steps.map((step, index) => (
              <li
                className="grid grid-cols-[1.75rem_1fr] gap-3"
                key={`${index}-${step.slice(0, 24)}`}
              >
                <span
                  aria-hidden="true"
                  className="grid size-7 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent tabular-nums"
                >
                  {index + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {recipe.tip ? (
        <section className="flex flex-col gap-2">
          <SectionTitle>Tip</SectionTitle>
          <Typography type="body">{recipe.tip}</Typography>
        </section>
      ) : null}
      {isOwner ? (
        <section className="flex flex-col gap-3 border-t border-border/60 pt-6">
          <SectionTitle>The catalog</SectionTitle>
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
