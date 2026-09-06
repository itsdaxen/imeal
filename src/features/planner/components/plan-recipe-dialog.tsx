"use client";

import { useState } from "react";
import { Button } from "@heroui/react";

import { ActionButton } from "@/components/ui/action";
import type { MealSlot } from "@/features/recipes/recipe.schema";

import { assignRecipeToSlot } from "../plan.actions";
import { AppDialog, closing } from "@/components/ui/app-dialog";
import { SelectField } from "@/components/ui/select-field";

type Day = { index: number; label: string; dateLabel: string };

const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snack: "Snack",
  dinner: "Dinner",
};

export function PlanRecipeDialog({
  days,
  recipeId,
  slots,
  weekStart,
}: {
  days: Day[];
  recipeId: string;
  slots: MealSlot[];
  weekStart: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (slots.length === 0) return null;

  return (
    <>
      <ActionButton onPress={() => setIsOpen(true)} tier="primary">
        Add to this week
      </ActionButton>

      <AppDialog
        heading="Choose a place in your week"
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      >
        <form
          action={closing(assignRecipeToSlot, () => setIsOpen(false))}
          className="flex flex-col gap-5"
        >
          <input name="recipeId" type="hidden" value={recipeId} />
          <input name="weekStart" type="hidden" value={weekStart} />

          <SelectField
            defaultSelectedKey={String(days[0].index)}
            label="Day"
            name="dayIndex"
            options={days.map((day) => ({
              id: String(day.index),
              label: `${day.label} · ${day.dateLabel}`,
              textValue: `${day.label}, ${day.dateLabel}`,
            }))}
          />

          <SelectField
            defaultSelectedKey={slots[0]}
            label="Meal"
            name="slot"
            options={slots.map((slot) => ({
              id: slot,
              label: SLOT_LABELS[slot],
            }))}
          />

          <Button className="w-full" type="submit">
            Add to plan
          </Button>
        </form>
      </AppDialog>
    </>
  );
}
