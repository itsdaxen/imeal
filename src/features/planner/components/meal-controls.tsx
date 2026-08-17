import { Button } from "@heroui/react";

import { setMealApproval, shuffleMeal } from "../plan.actions";

type MealControlsProps = {
  isApproved: boolean;
  itemId: string;
  weekStart: string;
};

export function MealControls({
  isApproved,
  itemId,
  weekStart,
}: MealControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <form action={setMealApproval}>
        <input name="itemId" type="hidden" value={itemId} />
        <input name="weekStart" type="hidden" value={weekStart} />
        <Button
          size="sm"
          type="submit"
          variant={isApproved ? "secondary" : "ghost"}
        >
          {isApproved ? "Approved" : "Approve"}
        </Button>
      </form>

      {isApproved ? null : (
        <form action={shuffleMeal}>
          <input name="itemId" type="hidden" value={itemId} />
          <input name="weekStart" type="hidden" value={weekStart} />
          <Button size="sm" type="submit" variant="ghost">
            Swap
          </Button>
        </form>
      )}
    </div>
  );
}
