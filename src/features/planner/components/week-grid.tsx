"use client";

import { useOptimistic, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@heroui/react";
import { CalendarDays, CalendarRange } from "lucide-react";

import { SectionTitle } from "@/components/ui/section-title";
import { ContentCard } from "@/components/ui/content-card";

import type { PlannedMeal, WeekPlan } from "../plan.queries";
import { weekDays } from "../week";
import { SlotCell } from "./slot-cell";
import { useServerAction } from "@/lib/use-server-action";
import { MAX_MEALS_PER_DAY, mealLabel } from "../day-shape";
import { AddMealButton } from "./add-meal-button";

type WeekGridProps = {
  /** Which day to open on, straight from the address bar. */
  day?: string;
  plan: WeekPlan;
  /** Whether a wide screen shows the whole week or one day of it. */
  view: "day" | "week";
  weekStart: string;
};

/**
 * What a meal change looks like before the server has agreed to it. Removing and
 * approving are both predictable, so the card can change immediately; shuffling
 * picks a recipe only the server knows, so it stays a pending state instead.
 */
export type MealChange =
  | { itemId: string; kind: "approval" }
  | { itemId: string; kind: "cooked" }
  | { dayIndex: number; kind: "remove"; slotIndex: number };

export type RunMealChange = (
  change: MealChange,
  action: (data: FormData) => Promise<void>,
  fields: Record<string, string>,
) => void;

function applyChange(meals: PlannedMeal[], change: MealChange) {
  if (change.kind === "remove") {
    return meals.filter(
      (meal) =>
        !(
          meal.dayIndex === change.dayIndex &&
          meal.slotIndex === change.slotIndex
        ),
    );
  }

  return meals.map((meal) => {
    if (meal.id !== change.itemId) return meal;
    if (change.kind === "cooked") {
      return {
        ...meal,
        cookedAt: meal.cookedAt ? null : new Date().toISOString(),
      };
    }
    return { ...meal, approved: !meal.approved };
  });
}

/** A day asked for by number, if it is one of this week's. */
function askedFor(value: string | undefined): number | undefined {
  const index = Number.parseInt(value ?? "", 10);

  return index >= 0 && index <= 6 ? index : undefined;
}

function mealAt(meals: PlannedMeal[], dayIndex: number, slotIndex: number) {
  return meals.find(
    (meal) => meal.dayIndex === dayIndex && meal.slotIndex === slotIndex,
  );
}

export function WeekGrid({ day, plan, view, weekStart }: WeekGridProps) {
  const days = weekDays(weekStart);
  const firstPlannedDay = days.find((entry) =>
    plan.meals.some((meal) => meal.dayIndex === entry.index),
  );
  const searchParams = useSearchParams();
  const [selectedDay, setSelectedDay] = useState(
    askedFor(day) ?? firstPlannedDay?.index ?? 0,
  );
  const [shownAs, setShownAs] = useState(view);
  const { run: send } = useServerAction();

  /**
   * Writes the choice into the address without asking the server for the page again.
   *
   * Which day you are looking at is worth putting in a link, but it is not worth a
   * round trip: the week is already here and the switch should land the moment it is
   * pressed. The History API keeps the two in step, so a reload, a shared link and
   * the back button all arrive where you were.
   */
  function remember(changes: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [name, value] of Object.entries(changes)) {
      params.set(name, value);
    }

    window.history.replaceState(null, "", `?${params}`);
  }

  function showDay(index: number) {
    setSelectedDay(index);
    remember({ day: String(index) });
  }
  const [meals, applyMeal] = useOptimistic(plan.meals, applyChange);

  // The optimistic update has to happen inside the same transition as the write, so
  // the change and the request that confirms it are one unit React can roll back.
  const runMealChange: RunMealChange = (change, action, fields) => {
    send(action, fields, () => applyMeal(change));
  };

  /**
   * One day's meals.
   *
   * `asColumn` is the difference between the two layouts: in the week grid a day is
   * one narrow column of seven, so its meals stack; on its own it has the whole width
   * and a single file of cards down the middle of a wide screen looks abandoned.
   */
  function dayCard(day: (typeof days)[number], asColumn = false) {
    return (
      <ContentCard density="compact" key={day.date}>
        <Card.Header>
          <SectionTitle className="xl:text-lg">{day.label}</SectionTitle>
          <Typography className="text-muted" type="body-xs">
            {day.dateLabel}
          </Typography>
        </Card.Header>

        <Card.Content>
          <div
            className={`grid grid-cols-1 items-start gap-3 sm:grid-cols-2 ${
              asColumn ? "xl:grid-cols-1" : "xl:grid-cols-4"
            }`}
          >
            {(plan.days[day.index] ?? []).map((slot, slotIndex) => (
              <SlotCell
                dayIndex={day.index}
                key={String(slotIndex)}
                label={mealLabel(plan.days[day.index] ?? [], slotIndex)}
                meal={mealAt(meals, day.index, slotIndex)}
                onMealChange={runMealChange}
                slot={slot}
                slotIndex={slotIndex}
                view={shownAs}
                weekStart={weekStart}
              />
            ))}
          </div>

          {/* After the last meal, because that is where another one goes. */}
          {(plan.days[day.index] ?? []).length < MAX_MEALS_PER_DAY ? (
            <div className="pt-3">
              <AddMealButton dayIndex={day.index} weekStart={weekStart} />
            </div>
          ) : null}
        </Card.Content>
      </ContentCard>
    );
  }

  const wholeWeek = shownAs === "week";

  return (
    <>
      {/* Only where seven columns fit. Narrower than this a week is unreadable, so
          there is no choice to offer. */}
      <div className="hidden justify-end xl:flex">
        <ToggleButtonGroup
          aria-label="How much of the week to show"
          data-flat
          disallowEmptySelection
          onSelectionChange={(keys) => {
            const chosen = [...keys][0] === "week" ? "week" : "day";
            setShownAs(chosen);
            remember({ view: chosen });
          }}
          selectedKeys={new Set([shownAs])}
          selectionMode="single"
          size="sm"
        >
          <ToggleButton className="min-h-9 gap-2 px-3" id="day">
            <CalendarDays aria-hidden="true" className="size-4" />
            Day
          </ToggleButton>
          <ToggleButton className="min-h-9 gap-2 px-3" id="week">
            <CalendarRange aria-hidden="true" className="size-4" />
            Week
          </ToggleButton>
        </ToggleButtonGroup>
      </div>

      <section
        aria-label="Week by day"
        className={`flex flex-col gap-4 ${wholeWeek ? "xl:hidden" : ""}`}
      >
        <div
          aria-label="Choose a day"
          className="grid grid-cols-7 gap-1"
          role="tablist"
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
                onClick={() => showDay(day.index)}
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

      {wholeWeek ? (
        <div className="hidden grid-cols-7 items-start gap-3 xl:grid">
          {days.map((entry) => dayCard(entry, true))}
        </div>
      ) : null}
    </>
  );
}
