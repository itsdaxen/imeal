"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { Card, Input, Label, Link, TextField, Typography } from "@heroui/react";

import { SectionTitle } from "@/components/ui/section-title";
import { ActionButton } from "@/components/ui/action";
import { ContentCard } from "@/components/ui/content-card";
import { artworkFor, MealArtwork } from "@/components/ui/meal-artwork";
import { TagList } from "@/components/ui/tag-list";
import { assignRecipeToSlot } from "@/features/planner/plan.actions";
import type { MealSlot } from "@/features/recipes/recipe.schema";

type Recipe = {
  id: string;
  image_url: string | null;
  meal_tags: MealSlot[];
  prep_minutes: number;
  servings: number;
  title: string;
};

export function AssignmentBrowser({
  dayIndex,
  mealSlot,
  recipes,
  weekStart,
}: {
  dayIndex: number;
  mealSlot: MealSlot;
  recipes: Recipe[];
  weekStart: string;
}) {
  const [query, setQuery] = useState("");
  const shown = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return needle
      ? recipes.filter((recipe) =>
          recipe.title.toLocaleLowerCase().includes(needle),
        )
      : recipes;
  }, [query, recipes]);

  return (
    <section className="flex flex-col gap-5" aria-label="Choose a recipe">
      {recipes.length > 4 ? (
        <TextField className="max-w-md" name="recipeSearch" onChange={setQuery}>
          <Label>Find a recipe</Label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted"
            />
            <Input className="pl-10" placeholder="Search by name" />
          </div>
        </TextField>
      ) : null}

      <Typography color="muted" type="body-sm">
        {shown.length} {shown.length === 1 ? "recipe" : "recipes"}
      </Typography>

      {shown.length === 0 ? (
        <ContentCard className="items-center py-10 text-center">
          <SectionTitle>No matching recipes</SectionTitle>
          <Typography color="muted" type="body-sm">
            Try another name.
          </Typography>
        </ContentCard>
      ) : (
        <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((recipe) => (
            <li key={recipe.id}>
              <ContentCard className="h-full" density="compact">
                <Link
                  className="block h-40 w-full flex-none overflow-hidden rounded-lg"
                  href={`/recipes/${recipe.id}`}
                  aria-label={`View ${recipe.title}`}
                >
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
                </Link>
                <Card.Header className="gap-2">
                  <TagList label="Meals this suits" tags={recipe.meal_tags} />
                  <Card.Title className="text-base">{recipe.title}</Card.Title>
                  <Card.Description>
                    {recipe.prep_minutes} min · serves {recipe.servings}
                  </Card.Description>
                </Card.Header>
                <Card.Footer className="mt-auto gap-3">
                  <form action={assignRecipeToSlot} className="flex-1">
                    <input name="weekStart" type="hidden" value={weekStart} />
                    <input name="dayIndex" type="hidden" value={dayIndex} />
                    <input name="slot" type="hidden" value={mealSlot} />
                    <input name="recipeId" type="hidden" value={recipe.id} />
                    <ActionButton
                      className="w-full"
                      tier="primary"
                      type="submit"
                    >
                      Choose
                    </ActionButton>
                  </form>
                  <Link
                    className="inline-flex min-h-11 items-center px-2 text-sm"
                    href={`/recipes/${recipe.id}`}
                  >
                    Details
                  </Link>
                </Card.Footer>
              </ContentCard>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
