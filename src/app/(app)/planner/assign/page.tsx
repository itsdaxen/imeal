import type { Metadata } from "next";

import Image from "next/image";
import { notFound } from "next/navigation";
import { Button, Card, Link, Typography } from "@heroui/react";

import { ContentCard } from "@/components/ui/content-card";
import { artworkFor, MealArtwork } from "@/components/ui/meal-artwork";
import { TagList } from "@/components/ui/tag-list";
import { assignRecipeToSlot } from "@/features/planner/plan.actions";
import { slotTargetSchema } from "@/features/planner/plan.schema";
import { resolveWeekStart, weekDays } from "@/features/planner/week";
import { listOwnedRecipes } from "@/features/recipes/recipe.queries";

export const metadata: Metadata = { title: "Plan a meal" };

export default async function AssignPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; day?: string; slot?: string }>;
}) {
  const { week, day, slot } = await searchParams;
  const target = slotTargetSchema.safeParse({
    weekStart: resolveWeekStart(week),
    dayIndex: day,
    slot,
  });

  if (!target.success) {
    notFound();
  }

  const { weekStart, dayIndex, slot: mealSlot } = target.data;
  const recipes = await listOwnedRecipes({ mealTag: mealSlot });
  const dayLabel = weekDays(weekStart)[dayIndex].label;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 pt-10 sm:pt-14">
      <header className="flex flex-col gap-3">
        <Link className="w-fit" href={`/planner?week=${weekStart}`}>
          ← Back to the week
        </Link>
        <Typography type="h1" weight="semibold">
          Plan {mealSlot} for {dayLabel}
        </Typography>
        <Typography className="text-muted" type="body-sm">
          Choose a {mealSlot} recipe from your collection. You can change it at
          any time before shopping.
        </Typography>
      </header>

      {recipes.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-border p-8 text-center">
          <Typography type="h2" weight="semibold">
            No {mealSlot} recipes yet
          </Typography>
          <Typography className="mt-2 text-muted" type="body-sm">
            Tag a recipe for {mealSlot}, then it will appear here.
          </Typography>
          <Link className="mt-5 inline-flex" href="/recipes/new">
            Add a recipe
          </Link>
        </section>
      ) : (
        <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <ContentCard className="h-full" density="compact">
                <Card.Content className="h-36 flex-none overflow-hidden rounded-lg">
                  {recipe.image_url ? (
                    <Image
                      alt=""
                      className="size-full object-cover"
                      height={192}
                      sizes="(min-width: 1024px) 20rem, (min-width: 640px) 45vw, 100vw"
                      src={recipe.image_url}
                      width={320}
                    />
                  ) : (
                    <MealArtwork
                      artwork={artworkFor(recipe.id)}
                      className="size-full"
                    />
                  )}
                </Card.Content>

                <Card.Header className="gap-2">
                  <TagList label="Meals this suits" tags={recipe.meal_tags} />
                  <Card.Title className="text-base">{recipe.title}</Card.Title>
                  <Card.Description>
                    {recipe.prep_minutes} min · serves {recipe.servings}
                  </Card.Description>
                </Card.Header>

                <Card.Footer className="mt-auto flex-wrap gap-3">
                  <form action={assignRecipeToSlot}>
                    <input name="weekStart" type="hidden" value={weekStart} />
                    <input name="dayIndex" type="hidden" value={dayIndex} />
                    <input name="slot" type="hidden" value={mealSlot} />
                    <input name="recipeId" type="hidden" value={recipe.id} />
                    <Button size="sm" type="submit">
                      Plan this
                    </Button>
                  </form>
                  <Link className="text-sm" href={`/recipes/${recipe.id}`}>
                    View recipe
                  </Link>
                </Card.Footer>
              </ContentCard>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
