import Image from "next/image";
import { buttonVariants, cn, Link, Typography } from "@heroui/react";

import { artworkFor, MealArtwork } from "@/components/ui/meal-artwork";
import type { MealSlot } from "@/features/recipes/recipe.schema";

import type { PlannedMeal } from "../plan.queries";
import { MealControls } from "./meal-controls";
import { MealMenu } from "./meal-menu";

type SlotCellProps = {
  dayIndex: number;
  meal?: PlannedMeal;
  slot: MealSlot;
  weekStart: string;
};

export function SlotCell({ dayIndex, meal, slot, weekStart }: SlotCellProps) {
  const assignHref = `/planner/assign?week=${weekStart}&day=${dayIndex}&slot=${slot}`;

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl ${
        meal
          ? meal.approved
            ? "bg-accent-soft/35 ring-1 ring-accent/40"
            : "bg-surface-secondary"
          : "min-h-14 border border-dashed border-border"
      }`}
    >
      {meal ? (
        <>
          <div className="flex flex-1 flex-col gap-2 p-3">
            <div className="flex items-start gap-2.5">
              <span className="size-11 shrink-0 overflow-hidden rounded-xl xl:hidden">
                {meal.recipe.imageUrl ? (
                  <Image
                    alt=""
                    className="size-full object-cover"
                    height={88}
                    sizes="44px"
                    src={meal.recipe.imageUrl}
                    width={88}
                  />
                ) : (
                  <MealArtwork
                    artwork={artworkFor(meal.recipe.id)}
                    className="size-full"
                  />
                )}
              </span>

              <div className="flex min-w-0 flex-col gap-1">
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
                {meal.approved ? (
                  <MealControls
                    isApproved
                    itemId={meal.id}
                    weekStart={weekStart}
                  />
                ) : null}
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between gap-2">
              {meal.approved ? (
                <Link
                  className={cn(
                    buttonVariants({ size: "sm", variant: "tertiary" }),
                    "min-h-11",
                  )}
                  href={`/cook/${meal.recipe.id}`}
                >
                  Cook
                </Link>
              ) : (
                <MealControls
                  isApproved={meal.approved}
                  itemId={meal.id}
                  weekStart={weekStart}
                />
              )}
              <MealMenu
                dayIndex={dayIndex}
                isApproved={meal.approved}
                itemId={meal.id}
                recipeId={meal.recipe.id}
                slot={slot}
                weekStart={weekStart}
              />
            </div>
          </div>
        </>
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
