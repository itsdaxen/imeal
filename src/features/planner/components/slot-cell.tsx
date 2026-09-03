import Image from "next/image";
import { Link, Typography } from "@heroui/react";

import { artworkFor, MealArtwork } from "@/components/ui/meal-artwork";
import type { MealSlot } from "@/features/recipes/recipe.schema";

import type { PlannedMeal } from "../plan.queries";
import { MealControls } from "./meal-controls";
import { MealMenu } from "./meal-menu";
import type { RunMealChange } from "./week-grid";

type SlotCellProps = {
  dayIndex: number;
  meal?: PlannedMeal;
  onMealChange: RunMealChange;
  slot: MealSlot;
  weekStart: string;
};

export function SlotCell({
  dayIndex,
  meal,
  onMealChange,
  slot,
  weekStart,
}: SlotCellProps) {
  const assignHref = `/planner/assign?week=${weekStart}&day=${dayIndex}&slot=${slot}`;

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
            {meal.recipe.imageUrl ? (
              <Image
                alt=""
                className="size-full object-cover"
                height={192}
                sizes="(min-width: 1280px) 10rem, (min-width: 640px) 45vw, 100vw"
                src={meal.recipe.imageUrl}
                width={256}
              />
            ) : (
              <MealArtwork
                artwork={artworkFor(meal.recipe.id)}
                className="size-full"
              />
            )}
          </span>

          <Typography
            className="capitalize"
            color="muted"
            type="body-xs"
            weight="semibold"
          >
            {slot}
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
              dayIndex={dayIndex}
              itemId={meal.id}
              onMealChange={onMealChange}
              recipeId={meal.recipe.id}
              slot={slot}
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
          Add <span className="capitalize">{slot}</span>
        </Link>
      )}
    </div>
  );
}
