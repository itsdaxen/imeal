import { Check } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";
import { generateShoppingList } from "@/features/shopping/shopping.actions";

type MealControlsProps = {
  listId: string;
  weekStart: string;
};

export function MealControls({ listId, weekStart }: MealControlsProps) {
  return (
    <form action={generateShoppingList}>
      <input name="listId" type="hidden" value={listId} />
      <input name="weekStart" type="hidden" value={weekStart} />
      <IconButton
        className="text-accent"
        label="Add this week to the shopping list"
        size="sm"
        type="submit"
        variant="ghost"
      >
        <Check aria-hidden="true" className="size-5" strokeWidth={2.5} />
      </IconButton>
    </form>
  );
}
