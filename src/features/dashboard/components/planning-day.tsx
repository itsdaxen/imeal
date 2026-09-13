"use client";

import { cva } from "class-variance-authority";
import { Surface } from "@heroui/react";

import { useDayFocus } from "./day-focus";

const dayCellVariants = cva(
  "relative flex w-full min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2.5 transition-shadow motion-reduce:transition-none",
  {
    variants: {
      isToday: {
        false: "",
        true: "bg-foreground text-background",
      },
      isFocused: {
        false: "",
        true: "",
      },
    },
    // Today is a fact about the date; focus is a thing you did. Today already stands
    // out on its own, and ringing the filled cell only draws a second outline around
    // something that was never in doubt — so the ring is for the days that need it.
    compoundVariants: [
      {
        isFocused: true,
        isToday: false,
        class: "ring-2 ring-accent ring-offset-2 ring-offset-surface",
      },
    ],
  },
);

// Seven labels have to fit at 320px, but not below the type ramp to do it.
const dayLabelVariants = cva("text-xs font-medium", {
  variants: {
    isToday: {
      false: "text-muted",
      true: "text-background/80",
    },
  },
});

const mealMarkerVariants = cva("size-1.5 rounded-full", {
  variants: {
    state: {
      empty: "bg-transparent",
      planned: "bg-accent",
      today: "bg-background",
    },
  },
});

type PlanningDayProps = {
  date: number;
  dayIndex: number;
  hasMeal: boolean;
  isToday: boolean;
  label: string;
};

export function PlanningDay({
  date,
  dayIndex,
  hasMeal,
  isToday,
  label,
}: PlanningDayProps) {
  const { day, focus } = useDayFocus();
  const isFocused = day === dayIndex;
  const markerState = !hasMeal ? "empty" : isToday ? "today" : "planned";

  return (
    <li className="min-w-0">
      {/* `min-h-0` lifts the button off the app's 44px floor: seven of these share the
          width of a phone, and the cell inside sets its own comfortable height. */}
      <button
        aria-pressed={isFocused}
        className="block min-h-0 w-full"
        onClick={() => focus(dayIndex)}
        type="button"
      >
        <Surface
          className={dayCellVariants({ isFocused, isToday })}
          variant={isToday ? "transparent" : "secondary"}
        >
          <span className={dayLabelVariants({ isToday })}>{label}</span>
          <span className="text-sm font-semibold">{date}</span>
          <span
            aria-hidden="true"
            className={mealMarkerVariants({ state: markerState })}
          />
          <span className="sr-only">
            {hasMeal ? "Meal planned" : "No meal planned"}
          </span>
        </Surface>
      </button>
    </li>
  );
}
