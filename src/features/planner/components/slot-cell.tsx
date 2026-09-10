import { Link, Typography } from "@heroui/react";

import type { MealSlot } from "@/features/recipes/recipe.schema";

import type { PlannedMeal } from "../plan.queries";
import { MealControls } from "./meal-controls";
import { MealMenu } from "./meal-menu";
import type { RunMealChange } from "./week-grid";
import { RecipeImage } from "@/components/ui/recipe-image";

type SlotCellProps = {
  dayIndex: number;
  /** "Lunch", or "Lunch 2" where the day holds more than one. */
  label: string;
  meal?: PlannedMeal;
  onMealChange: RunMealChange;
  slot: MealSlot;
  slotIndex: number;
  weekStart: string;
};

export function SlotCell({
  dayIndex,
  label,
  meal,
  onMealChange,
  slot,
  slotIndex,
  weekStart,
}: SlotCellProps) {
  const assignHref = `/planner/assign?week=${weekStart}&day=${dayIndex}&slot=${slot}&index=${slotIndex}`;

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl ${
        meal
          ? "bg-surface-secondary"
          : "min-h-14 border border-dashed border-border"
      }`}
    >
      {meal ? (
        <div className="flex flex-col gap-2 p-3">
          <span className="aspect-[4/3] w-full overflow-hidden rounded-xl">
            <RecipeImage
              className="size-full"
              height={192}
              id={meal.recipe.id}
              imageUrl={meal.recipe.imageUrl}
              sizes="(min-width: 1280px) 10rem, (min-width: 640px) 45vw, 100vw"
              width={256}
            />
          </span>

          <Typography
            className=""
            color="muted"
            type="body-xs"
            weight="semibold"
          >
            {label}
          </Typography>
          <Link
            className="line-clamp-2 text-sm font-semibold text-foreground no-underline"
            href={`/recipes/${meal.recipe.id}`}
          >
            {meal.recipe.title}
          </Link>
          <Typography color="muted" type="body-xs">
            {meal.recipe.prepMinutes} min
          </Typography>
          <div className="flex items-center justify-end gap-1">
            <MealControls
              approved={meal.approved}
              itemId={meal.id}
              onMealChange={onMealChange}
              weekStart={weekStart}
            />
            <MealMenu
              assignHref={assignHref}
              dayIndex={dayIndex}
              itemId={meal.id}
              onMealChange={onMealChange}
              recipeId={meal.recipe.id}
              slot={slot}
              slotIndex={slotIndex}
              weekStart={weekStart}
            />
          </div>
        </div>
      ) : (
        <Link
          className="flex min-h-14 items-center gap-2 px-3 text-sm font-medium no-underline"
          href={assignHref}
        >
          <span aria-hidden="true" className="text-lg leading-none">
            +
          </span>
          Add {label.toLocaleLowerCase()}
        </Link>
      )}
    </div>
  );
}
