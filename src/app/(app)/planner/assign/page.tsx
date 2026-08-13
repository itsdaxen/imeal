import type { Metadata } from "next";

import { notFound } from "next/navigation";
import { Button, Link, Typography } from "@heroui/react";

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
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 pt-10 sm:pt-14">
      <header className="flex flex-col gap-2">
        <Typography type="h1" weight="semibold">
          Plan {mealSlot} for {dayLabel}
        </Typography>
        <Link href={`/planner?week=${weekStart}`}>Back to the week</Link>
      </header>

      {recipes.length === 0 ? (
        <Typography className="text-muted" type="body">
          No recipes are tagged for {mealSlot} yet.{" "}
          <Link href="/recipes/new">Add one</Link>.
        </Typography>
      ) : (
        <ul className="flex list-none flex-col gap-2 p-0">
          {recipes.map((recipe) => (
            <li
              className="flex items-center justify-between gap-4 rounded-2xl border border-border/80 px-4 py-3"
              key={recipe.id}
            >
              <div className="flex flex-col">
                <span className="font-medium">{recipe.title}</span>
                <span className="text-sm text-muted">
                  {recipe.prep_minutes} min · serves {recipe.servings}
                </span>
              </div>

              <form action={assignRecipeToSlot}>
                <input name="weekStart" type="hidden" value={weekStart} />
                <input name="dayIndex" type="hidden" value={dayIndex} />
                <input name="slot" type="hidden" value={mealSlot} />
                <input name="recipeId" type="hidden" value={recipe.id} />
                <Button size="sm" type="submit">
                  Plan this
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
