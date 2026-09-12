import type { Metadata } from "next";

import { notFound } from "next/navigation";
import { Card, Chip, Typography } from "@heroui/react";

import { SectionTitle } from "@/components/ui/section-title";
import { ActionLink } from "@/components/ui/action";
import { ContentCard } from "@/components/ui/content-card";
import { PendingButton } from "@/components/ui/pending-button";
import { TagList } from "@/components/ui/tag-list";
import { getCurrentUser } from "@/features/auth/current-user";
import { listFriends } from "@/features/friends/friend.queries";
import { RecipeOwnerMenu } from "@/features/recipes/components/recipe-owner-menu";
import { isCurrentUserAdmin } from "@/features/catalog/catalog.queries";
import { saveCatalogRecipe } from "@/features/catalog/catalog.actions";
import { CatalogAdminMenu } from "@/features/catalog/components/catalog-admin-menu";
import {
  getRecipe,
  listOwnedCollections,
} from "@/features/recipes/recipe.queries";
import { listMySuggestions } from "@/features/catalog/catalog.queries";
import { listShareRecipients } from "@/features/sharing/sharing.queries";
import { copySharedRecipe } from "@/features/sharing/sharing.actions";
import { PlanRecipeDialog } from "@/features/planner/components/plan-recipe-dialog";
import { currentWeekStart, weekDays } from "@/features/planner/week";
import { PageShell } from "@/components/ui/page-shell";
import { RecipeImage } from "@/components/ui/recipe-image";
import { getWeekPlan } from "@/features/planner/plan.queries";

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
  const [recipe, user, isAdmin, week] = await Promise.all([
    getRecipe(id),
    getCurrentUser(),
    isCurrentUserAdmin(),
    getWeekPlan(currentWeekStart()),
  ]);

  if (!recipe) {
    notFound();
  }

  // A shared recipe is readable but not the recipient's to change.
  const isOwner = Boolean(user && recipe.owner_id === user.id);
  const isCatalogRecipe = recipe.owner_id === null;
  const [friends, recipientIds, suggestions, knownCollections] = isOwner
    ? await Promise.all([
        listFriends(),
        listShareRecipients(recipe.id),
        listMySuggestions(),
        listOwnedCollections(),
      ])
    : [[], [], [], []];
  const suggestion = suggestions.find((item) => item.recipe.id === recipe.id);

  return (
    <PageShell width="wide">
      <ContentCard
        appearance="media"
        className="relative grid md:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]"
        density="flush"
      >
        {isOwner ? (
          <RecipeOwnerMenu
            collections={recipe.collection_tags}
            friends={friends}
            id={recipe.id}
            knownCollections={knownCollections}
            recipientIds={recipientIds}
            suggestion={suggestion}
          />
        ) : isCatalogRecipe && isAdmin ? (
          <CatalogAdminMenu recipeId={recipe.id} />
        ) : null}
        <Card.Content className="min-h-64 flex-none p-0 md:min-h-[30rem]">
          <RecipeImage
            className="size-full"
            height={640}
            id={recipe.id}
            imageUrl={recipe.image_url}
            preload
            sizes="(min-width: 768px) 34rem, 100vw"
            width={720}
          />
        </Card.Content>

        <Card.Header className="flex-col items-start justify-center gap-5 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <TagList label="Meals this suits" tags={recipe.meal_tags} />
              {recipe.collection_tags.length > 0 ? (
                <TagList label="Collections" tags={recipe.collection_tags} />
              ) : null}
            </div>
          </div>
          {/* The catalog action sits in the menu, but its state has to stay visible
              here — otherwise a pending or declined suggestion is invisible. */}
          {isOwner && suggestion ? (
            <Chip
              color={suggestion.status === "approved" ? "accent" : "default"}
              size="sm"
              variant="soft"
            >
              {suggestion.status === "approved"
                ? "In the catalog"
                : suggestion.status === "pending"
                  ? "Catalog review pending"
                  : `Not published${suggestion.reviewerNote ? ` — ${suggestion.reviewerNote}` : ""}`}
            </Chip>
          ) : null}
          <Typography type="h1" weight="semibold">
            {recipe.title}
          </Typography>
          <Typography className="text-muted" type="body-sm">
            {recipe.prep_minutes} min · serves {recipe.servings}
          </Typography>

          <div className="flex flex-wrap items-center gap-3">
            {isOwner || isCatalogRecipe ? (
              <PlanRecipeDialog
                days={weekDays(currentWeekStart())}
                shapes={week.days}
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
            {isOwner ? null : isCatalogRecipe ? (
              <form action={saveCatalogRecipe}>
                <input name="recipeId" type="hidden" value={recipe.id} />
                <PendingButton className="min-h-11" variant="tertiary">
                  Save a copy
                </PendingButton>
              </form>
            ) : (
              <form action={copySharedRecipe}>
                <input name="recipeId" type="hidden" value={recipe.id} />
                <PendingButton className="min-h-11" variant="tertiary">
                  Save a copy
                </PendingButton>
              </form>
            )}
          </div>
        </Card.Header>
      </ContentCard>

      <div className="grid gap-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-12">
        <ContentCard density="spacious">
          <SectionTitle>Ingredients</SectionTitle>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-muted">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={`${index}-${ingredient}`}>{ingredient}</li>
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
    </PageShell>
  );
}
