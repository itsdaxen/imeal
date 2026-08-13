import { Button } from "@heroui/react";

import type { MealSlot } from "@/features/recipes/recipe.schema";

import { clearSlot } from "../plan.actions";

type ClearSlotFormProps = {
  dayIndex: number;
  slot: MealSlot;
  weekStart: string;
};

export function ClearSlotForm({
  dayIndex,
  slot,
  weekStart,
}: ClearSlotFormProps) {
  return (
    <form action={clearSlot}>
      <input name="weekStart" type="hidden" value={weekStart} />
      <input name="dayIndex" type="hidden" value={dayIndex} />
      <input name="slot" type="hidden" value={slot} />
      <Button size="sm" type="submit" variant="ghost">
        Clear
      </Button>
    </form>
  );
}
