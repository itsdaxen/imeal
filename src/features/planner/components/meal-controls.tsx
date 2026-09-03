"use client";

import { Check } from "lucide-react";
import { Chip } from "@heroui/react";

import { IconButton } from "@/components/ui/icon-button";

import { setMealApproval } from "../plan.actions";
import type { RunMealChange } from "./week-grid";

type MealControlsProps = {
  approved: boolean;
  itemId: string;
  onMealChange: RunMealChange;
  weekStart: string;
};

/**
 * Approving is how a meal's ingredients reach the shopping list, so the control says
 * what it does rather than showing a bare tick: unapproved offers the action,
 * approved reports the state and can be pressed again to take it back.
 */
export function MealControls({
  approved,
  itemId,
  onMealChange,
  weekStart,
}: MealControlsProps) {
  function toggle() {
    onMealChange({ itemId, kind: "approval" }, setMealApproval, {
      itemId,
      weekStart,
    });
  }

  if (approved) {
    return (
      <button
        aria-label="Remove this meal's ingredients from the shopping list"
        className="rounded-full"
        onClick={toggle}
        type="button"
      >
        <Chip color="accent" size="sm" variant="soft">
          <Check aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
          Added
        </Chip>
      </button>
    );
  }

  return (
    <IconButton
      className="text-accent"
      label="Approve and add this meal's ingredients to the shopping list"
      onPress={toggle}
      size="sm"
      variant="ghost"
    >
      <Check aria-hidden="true" className="size-5" strokeWidth={2.5} />
    </IconButton>
  );
}
