import type { Metadata } from "next";

import { notFound } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { Typography } from "@heroui/react";

import { BackLink } from "@/components/ui/back-link";
import { ActionLink } from "@/components/ui/action";
import { ContentCard } from "@/components/ui/content-card";
import { EmptyState } from "@/components/ui/empty-state";
import { AssignmentBrowser } from "@/features/planner/components/assignment-browser";
import { RecipeSourcePicker } from "@/features/planner/components/recipe-source-picker";
import { listCatalog } from "@/features/catalog/catalog.queries";
import { getWeekPlan } from "@/features/planner/plan.queries";
import { slotTargetSchema } from "@/features/planner/plan.schema";
import {
  plannerHref,
  resolveWeekStart,
  weekDays,
} from "@/features/planner/week";
import { listOwnedRecipes } from "@/features/recipes/recipe.queries";
import { PageShell } from "@/components/ui/page-shell";

export const metadata: Metadata = { title: "Plan a meal" };

export default async function AssignPage({
  searchParams,
}: {
  searchParams: Promise<{
    day?: string;
    index?: string;
    slot?: string;
    source?: string;
    view?: string;
    week?: string;
  }>;
}) {
  const { day, index, slot, source, view, week } = await searchParams;
  const shelf = source === "catalog" ? "catalog" : "mine";
  const target = slotTargetSchema.safeParse({
    weekStart: resolveWeekStart(week),
    dayIndex: day,
    slotIndex: index,
    slot,
  });

  if (!target.success) {
    notFound();
  }

  const { weekStart, dayIndex, slotIndex, slot: mealSlot } = target.data;
  const [recipes, plan] = await Promise.all([
    shelf === "catalog"
      ? listCatalog({ mealTag: mealSlot })
      : listOwnedRecipes({ mealTag: mealSlot }),
    getWeekPlan(weekStart),
  ]);
  const dayLabel = weekDays(weekStart)[dayIndex].label;
  const current = plan.meals.find(
    (meal) => meal.dayIndex === dayIndex && meal.slotIndex === slotIndex,
  );

  return (
    <PageShell width="wide">
      <header className="flex flex-col gap-3">
        <BackLink href={plannerHref(weekStart, dayIndex, view)}>
          Back to the week
        </BackLink>
        <Typography type="h1" weight="semibold">
          Plan {mealSlot} for {dayLabel}
        </Typography>
        <Typography className="text-muted" type="body-sm">
          Choose a {mealSlot} recipe from{" "}
          {shelf === "catalog" ? "the catalog" : "your own recipes"}. You can
          change it at any time before shopping.
        </Typography>
        <RecipeSourcePicker source={shelf} />
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
            shelf === "catalog" ? null : (
              <ActionLink href="/recipes/new" tier="primary">
                Add a recipe
              </ActionLink>
            )
          }
          description={
            shelf === "catalog" ? (
              <>Nothing in the catalog is tagged for {mealSlot} yet.</>
            ) : (
              <>Tag a recipe for {mealSlot}, then it will appear here.</>
            )
          }
          icon={<CalendarDays aria-hidden="true" className="size-6" />}
          title={
            shelf === "catalog"
              ? `No ${mealSlot} recipes in the catalog`
              : `No ${mealSlot} recipes of your own`
          }
        />
      ) : (
        <AssignmentBrowser
          slotIndex={slotIndex}
          dayIndex={dayIndex}
          mealSlot={mealSlot}
          recipes={recipes}
          shelf={shelf}
          view={view}
          weekStart={weekStart}
        />
      )}
    </PageShell>
  );
}
