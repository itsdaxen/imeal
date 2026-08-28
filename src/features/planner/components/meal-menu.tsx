"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { Dropdown } from "@heroui/react";

import { IconButton } from "@/components/ui/icon-button";
import type { MealSlot } from "@/features/recipes/recipe.schema";

import { clearSlot, setMealApproval, shuffleMeal } from "../plan.actions";

type MealMenuProps = {
  dayIndex: number;
  isApproved: boolean;
  itemId: string;
  recipeId: string;
  slot: MealSlot;
  weekStart: string;
};

export function MealMenu({
  dayIndex,
  isApproved,
  itemId,
  recipeId,
  slot,
  weekStart,
}: MealMenuProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const assignHref = `/planner/assign?week=${weekStart}&day=${dayIndex}&slot=${slot}`;

  function run(
    action: (data: FormData) => Promise<void>,
    fields: Record<string, string>,
  ) {
    const data = new FormData();
    Object.entries(fields).forEach(([name, value]) => data.set(name, value));
    startTransition(() => action(data));
  }

  return (
    <Dropdown>
      <IconButton
        isPending={isPending}
        label="Meal options"
        size="sm"
        variant="ghost"
      >
        <MoreHorizontal aria-hidden="true" className="size-5" />
      </IconButton>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu>
          {!isApproved ? (
            <Dropdown.Item
              id="cook"
              onAction={() => router.push(`/cook/${recipeId}`)}
              textValue="Cook now"
            >
              Cook now
            </Dropdown.Item>
          ) : null}
          <Dropdown.Item
            id="change"
            onAction={() => router.push(assignHref)}
            textValue="Choose another recipe"
          >
            Choose another recipe
          </Dropdown.Item>
          {!isApproved ? (
            <Dropdown.Item
              id="swap"
              onAction={() => run(shuffleMeal, { itemId, weekStart })}
              textValue="Pick another for me"
            >
              Pick another for me
            </Dropdown.Item>
          ) : (
            <Dropdown.Item
              id="review"
              onAction={() => run(setMealApproval, { itemId, weekStart })}
              textValue="Mark for review"
            >
              Mark for review
            </Dropdown.Item>
          )}
          <Dropdown.Item
            className="text-danger"
            id="remove"
            onAction={() =>
              run(clearSlot, {
                dayIndex: String(dayIndex),
                slot,
                weekStart,
              })
            }
            textValue="Remove from week"
            variant="danger"
          >
            Remove from week
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
