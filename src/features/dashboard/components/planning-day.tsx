import { cva } from "class-variance-authority";
import { Surface } from "@heroui/react";

const dayCellVariants = cva(
  "relative flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-2.5",
  {
    variants: {
      isToday: {
        false: "",
        true: "bg-accent text-accent-foreground",
      },
    },
  },
);

// Seven labels have to fit at 320px, but not below the type ramp to do it.
const dayLabelVariants = cva("text-xs font-medium", {
  variants: {
    isToday: {
      false: "text-muted",
      true: "text-accent-foreground/80",
    },
  },
});

const mealMarkerVariants = cva("size-1.5 rounded-full", {
  variants: {
    state: {
      empty: "bg-transparent",
      planned: "bg-accent",
      today: "bg-accent-foreground",
    },
  },
});

type PlanningDayProps = {
  date: number;
  hasMeal: boolean;
  isToday: boolean;
  label: string;
};

export function PlanningDay({
  date,
  hasMeal,
  isToday,
  label,
}: PlanningDayProps) {
  const markerState = !hasMeal ? "empty" : isToday ? "today" : "planned";

  return (
    <li className="min-w-0">
      <Surface
        className={dayCellVariants({ isToday })}
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
    </li>
  );
}
