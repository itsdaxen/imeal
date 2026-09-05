"use client";

import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { Dropdown } from "@heroui/react";

import { IconButton } from "@/components/ui/icon-button";
import type { MealSlot } from "@/features/recipes/recipe.schema";

import { clearSlot, shuffleMeal } from "../plan.actions";
import type { RunMealChange } from "./week-grid";
import { useServerAction } from "@/lib/use-server-action";

type MealMenuProps = {
  dayIndex: number;
  itemId: string;
  onMealChange: RunMealChange;
  recipeId: string;
  slot: MealSlot;
  weekStart: string;
};

export function MealMenu({
  dayIndex,
  itemId,
  onMealChange,
  recipeId,
  slot,
  weekStart,
}: MealMenuProps) {
  const router = useRouter();
  const { isPending, run } = useServerAction();
  const assignHref = `/planner/assign?week=${weekStart}&day=${dayIndex}&slot=${slot}`;

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
          <Dropdown.Item
            id="cook"
            onAction={() => router.push(`/cook/${recipeId}`)}
            textValue="Cook now"
          >
            Cook now
          </Dropdown.Item>
          <Dropdown.Item
            id="change"
            onAction={() => router.push(assignHref)}
            textValue="Choose another recipe"
          >
            Choose another recipe
          </Dropdown.Item>
          <Dropdown.Item
            id="swap"
            onAction={() => run(shuffleMeal, { itemId, weekStart })}
            textValue="Pick another for me"
          >
            Pick another for me
          </Dropdown.Item>
          <Dropdown.Item
            className="text-danger"
            id="remove"
            onAction={() =>
              onMealChange({ dayIndex, kind: "remove", slot }, clearSlot, {
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
