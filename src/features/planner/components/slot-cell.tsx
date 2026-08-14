import { Link, Typography } from "@heroui/react";

import type { MealSlot } from "@/features/recipes/recipe.schema";

import type { PlannedMeal } from "../plan.queries";
import { ClearSlotForm } from "./clear-slot-form";

type SlotCellProps = {
  dayIndex: number;
  meal?: PlannedMeal;
  slot: MealSlot;
  weekStart: string;
};

export function SlotCell({ dayIndex, meal, slot, weekStart }: SlotCellProps) {
  const assignHref = `/planner/assign?week=${weekStart}&day=${dayIndex}&slot=${slot}`;

  return (
    <div className="flex min-h-24 flex-col gap-1.5 rounded-2xl border border-border/80 p-3">
      <Typography
        className="text-muted capitalize"
        type="body-xs"
        weight="semibold"
      >
        {slot}
      </Typography>

      {meal ? (
        <>
          <Link
            className="text-sm font-medium text-foreground no-underline"
            href={`/recipes/${meal.recipe.id}`}
          >
            {meal.recipe.title}
          </Link>
          <Typography className="text-muted" type="body-xs">
            {meal.recipe.prepMinutes} min
          </Typography>
          <div className="mt-auto flex flex-wrap items-center gap-2">
            <Link className="text-xs" href={`/cook/${meal.recipe.id}`}>
              Cook
            </Link>
            <Link className="text-xs" href={assignHref}>
              Change
            </Link>
            <ClearSlotForm
              dayIndex={dayIndex}
              slot={slot}
              weekStart={weekStart}
            />
          </div>
        </>
      ) : (
        <Link className="mt-auto text-xs" href={assignHref}>
          Plan something
        </Link>
      )}
    </div>
  );
}
