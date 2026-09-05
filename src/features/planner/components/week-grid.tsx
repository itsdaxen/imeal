"use client";

import { useOptimistic, useState } from "react";
import { Card, Typography } from "@heroui/react";

import { SectionTitle } from "@/components/ui/section-title";
import { ContentCard } from "@/components/ui/content-card";

import type { MealSlot } from "@/features/recipes/recipe.schema";

import type { PlannedMeal, WeekPlan } from "../plan.queries";
import { weekDays } from "../week";
import { SlotCell } from "./slot-cell";
import { useServerAction } from "@/lib/use-server-action";

type WeekGridProps = {
  plan: WeekPlan;
  weekStart: string;
};

/**
 * What a meal change looks like before the server has agreed to it. Removing and
 * approving are both predictable, so the card can change immediately; shuffling
 * picks a recipe only the server knows, so it stays a pending state instead.
 */
export type MealChange =
  | { itemId: string; kind: "approval" }
  | { dayIndex: number; kind: "remove"; slot: MealSlot };

export type RunMealChange = (
  change: MealChange,
  action: (data: FormData) => Promise<void>,
  fields: Record<string, string>,
) => void;

function applyChange(meals: PlannedMeal[], change: MealChange) {
  if (change.kind === "remove") {
    return meals.filter(
      (meal) =>
        !(meal.dayIndex === change.dayIndex && meal.slot === change.slot),
    );
  }

  return meals.map((meal) =>
    meal.id === change.itemId ? { ...meal, approved: !meal.approved } : meal,
  );
}

function mealAt(meals: PlannedMeal[], dayIndex: number, slot: string) {
  return meals.find((meal) => meal.dayIndex === dayIndex && meal.slot === slot);
}

export function WeekGrid({ plan, weekStart }: WeekGridProps) {
  const days = weekDays(weekStart);
  const firstPlannedDay = days.find((day) =>
    plan.meals.some((meal) => meal.dayIndex === day.index),
  );
  const [selectedDay, setSelectedDay] = useState(firstPlannedDay?.index ?? 0);
  const { run: send } = useServerAction();
  const [meals, applyMeal] = useOptimistic(plan.meals, applyChange);

  // The optimistic update has to happen inside the same transition as the write, so
  // the change and the request that confirms it are one unit React can roll back.
  const runMealChange: RunMealChange = (change, action, fields) => {
    send(action, fields, () => applyMeal(change));
  };

  function dayCard(day: (typeof days)[number]) {
    return (
      <ContentCard density="compact" key={day.date}>
        <Card.Header>
          <SectionTitle className="xl:text-lg">{day.label}</SectionTitle>
          <Typography className="text-muted" type="body-xs">
            {day.dateLabel}
          </Typography>
        </Card.Header>

        <Card.Content>
          <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {plan.enabledSlots.map((slot) => (
              <SlotCell
                dayIndex={day.index}
                key={slot}
                meal={mealAt(meals, day.index, slot)}
                onMealChange={runMealChange}
                slot={slot}
                weekStart={weekStart}
              />
            ))}
          </div>
        </Card.Content>
      </ContentCard>
    );
  }

  return (
    <>
      <section
        className="flex flex-col gap-4 xl:hidden"
        aria-label="Week by day"
      >
        <div
          className="grid grid-cols-7 gap-1"
          role="tablist"
          aria-label="Choose a day"
        >
          {days.map((day) => {
            const hasMeal = meals.some((meal) => meal.dayIndex === day.index);
            const selected = day.index === selectedDay;
            return (
              <button
                aria-controls={`planner-day-${day.index}`}
                aria-selected={selected}
                className={`flex min-h-14 flex-col items-center justify-center rounded-xl px-1 text-xs transition-colors ${selected ? "bg-foreground text-background" : "bg-surface text-foreground"}`}
                key={day.date}
                onClick={() => setSelectedDay(day.index)}
                role="tab"
                type="button"
              >
                <span className="font-semibold">{day.label.slice(0, 3)}</span>
                <span className="flex items-center gap-1 text-xs">
                  {day.dateLabel.split(" ").at(-1)}
                  {hasMeal ? (
                    <span
                      aria-label="Meal planned"
                      className="size-1.5 rounded-full bg-accent"
                    />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
        <div id={`planner-day-${selectedDay}`} role="tabpanel">
          {dayCard(days[selectedDay]!)}
        </div>
      </section>

      <div className="hidden grid-cols-7 items-start gap-3 xl:grid">
        {days.map((day) => dayCard(day))}
      </div>
    </>
  );
}
