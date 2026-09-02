import { Check } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";
import { addPlannedMealToShoppingList } from "@/features/shopping/shopping.actions";

type MealControlsProps = {
  itemId: string;
  listId: string;
  weekStart: string;
};

export function MealControls({ itemId, listId, weekStart }: MealControlsProps) {
  return (
    <form action={addPlannedMealToShoppingList}>
      <input name="itemId" type="hidden" value={itemId} />
      <input name="listId" type="hidden" value={listId} />
      <input name="weekStart" type="hidden" value={weekStart} />
      <IconButton
        className="text-accent"
        label="Add this meal to the shopping list"
        size="sm"
        type="submit"
        variant="ghost"
      >
        <Check aria-hidden="true" className="size-5" strokeWidth={2.5} />
      </IconButton>
    </form>
  );
}
