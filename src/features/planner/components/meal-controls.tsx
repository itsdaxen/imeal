import { Button, Chip } from "@heroui/react";

import { setMealApproval } from "../plan.actions";

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
    <div className="flex items-center">
      {isApproved ? (
        <Chip color="accent" size="sm" variant="soft">
          Approved
        </Chip>
      ) : (
        <form action={setMealApproval}>
          <input name="itemId" type="hidden" value={itemId} />
          <input name="weekStart" type="hidden" value={weekStart} />
          <Button
            size="sm"
            type="submit"
            className="min-h-10"
            variant="primary"
          >
            Approve
          </Button>
        </form>
      )}
    </div>
  );
}
