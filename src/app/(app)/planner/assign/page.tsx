import type { Metadata } from "next";

import { notFound } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { Typography } from "@heroui/react";

import { ActionLink } from "@/components/ui/action";
import { ContentCard } from "@/components/ui/content-card";
import { EmptyState } from "@/components/ui/empty-state";
import { AssignmentBrowser } from "@/features/planner/components/assignment-browser";
import { getWeekPlan } from "@/features/planner/plan.queries";
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
  const [recipes, plan] = await Promise.all([
    listOwnedRecipes({ mealTag: mealSlot }),
    getWeekPlan(weekStart),
  ]);
  const dayLabel = weekDays(weekStart)[dayIndex].label;
  const current = plan.meals.find(
    (meal) => meal.dayIndex === dayIndex && meal.slot === mealSlot,
  );

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 pt-10 sm:pt-14">
      <header className="flex flex-col gap-3">
        <ActionLink
          className="w-fit"
          href={`/planner?week=${weekStart}`}
          tier="quiet"
        >
          ← Back to the week
        </ActionLink>
        <Typography type="h1" weight="semibold">
          Plan {mealSlot} for {dayLabel}
        </Typography>
        <Typography className="text-muted" type="body-sm">
          Choose a {mealSlot} recipe from your collection. You can change it at
          any time before shopping.
        </Typography>
      </header>

      <ContentCard
        aria-label="Planning destination"
        className="sticky top-4 z-20 flex-row items-center justify-between gap-4 py-3"
        density="compact"
      >
        <span>
          <Typography className="capitalize" type="body-sm" weight="semibold">
            {dayLabel} · {mealSlot}
          </Typography>
          <Typography color="muted" type="body-xs">
            {current ? `Replacing ${current.recipe.title}` : "Empty slot"}
          </Typography>
        </span>
        <Typography color="muted" type="body-xs">
          {recipes.length} options
        </Typography>
      </ContentCard>

      {recipes.length === 0 ? (
        <EmptyState
          actions={
            <ActionLink href="/recipes/new" tier="primary">
              Add a recipe
            </ActionLink>
          }
          description={
            <>Tag a recipe for {mealSlot}, then it will appear here.</>
          }
          icon={<CalendarDays aria-hidden="true" className="size-6" />}
          title={`No ${mealSlot} recipes yet`}
        />
      ) : (
        <AssignmentBrowser
          dayIndex={dayIndex}
          mealSlot={mealSlot}
          recipes={recipes}
          weekStart={weekStart}
        />
      )}
    </main>
  );
}
