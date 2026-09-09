"use client";

import { useState } from "react";

import { ActionButton } from "@/components/ui/action";
import type { MealSlot } from "@/features/recipes/recipe.schema";

import { assignRecipeToSlot } from "../plan.actions";
import { mealLabel } from "../day-shape";
import { AppDialog, closing } from "@/components/ui/app-dialog";
import { SelectField } from "@/components/ui/select-field";
import { PendingButton } from "@/components/ui/pending-button";

type Day = { index: number; label: string; dateLabel: string };

export function PlanRecipeDialog({
  day,
  days,
  recipeId,
  slots,
  weekStart,
}: {
  /** The shape of a day this week, so a second lunch can be chosen as such. */
  day: MealSlot[];
  days: Day[];
  recipeId: string;
  slots: MealSlot[];
  weekStart: string;
}) {
  // Only the places this recipe suits: a breakfast recipe should not offer to be
  // dinner just because the day has one.
  const places = day
    .map((slot, slotIndex) => ({ slot, slotIndex }))
    .filter((place) => slots.includes(place.slot));

  const [isOpen, setIsOpen] = useState(false);
  const [chosen, setChosen] = useState(places[0]?.slotIndex ?? 0);

  if (places.length === 0) return null;

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

          {/* The index identifies the meal; its type rides along so the row records
              what kind of meal it is without a second lookup. */}
          <input name="slot" type="hidden" value={day[chosen] ?? ""} />
          <SelectField
            label="Meal"
            name="slotIndex"
            onChange={(value) => setChosen(Number(value))}
            options={places.map((place) => ({
              id: String(place.slotIndex),
              label: mealLabel(day, place.slotIndex),
            }))}
            selectedKey={String(chosen)}
          />

          <PendingButton className="w-full">Add to plan</PendingButton>
        </form>
      </AppDialog>
    </>
  );
}
