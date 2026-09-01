"use client";

import { useState } from "react";
import { Card, Typography } from "@heroui/react";

import { SectionTitle } from "@/components/ui/section-title";
import { ContentCard } from "@/components/ui/content-card";

import type { WeekPlan } from "../plan.queries";
import { weekDays } from "../week";
import { SlotCell } from "./slot-cell";

type WeekGridProps = {
  listId: string | null;
  plan: WeekPlan;
  weekStart: string;
};

function mealAt(plan: WeekPlan, dayIndex: number, slot: string) {
  return plan.meals.find(
    (meal) => meal.dayIndex === dayIndex && meal.slot === slot,
  );
}

export function WeekGrid({ listId, plan, weekStart }: WeekGridProps) {
  const days = weekDays(weekStart);
  const firstPlannedDay = days.find((day) =>
    plan.meals.some((meal) => meal.dayIndex === day.index),
  );
  const [selectedDay, setSelectedDay] = useState(firstPlannedDay?.index ?? 0);

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
                listId={listId}
                meal={mealAt(plan, day.index, slot)}
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
            const hasMeal = plan.meals.some(
              (meal) => meal.dayIndex === day.index,
            );
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
