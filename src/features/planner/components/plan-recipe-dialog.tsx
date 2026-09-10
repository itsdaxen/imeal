"use client";

import { useState } from "react";

import { ActionButton } from "@/components/ui/action";
import type { MealSlot } from "@/features/recipes/recipe.schema";

import { assignRecipeToSlot } from "../plan.actions";
import { mealLabel, type WeekShape } from "../day-shape";
import { AppDialog, closing } from "@/components/ui/app-dialog";
import { SelectField } from "@/components/ui/select-field";
import { PendingButton } from "@/components/ui/pending-button";

type Day = { index: number; label: string; dateLabel: string };

export function PlanRecipeDialog({
  days,
  recipeId,
  shapes,
  slots,
  weekStart,
}: {
  days: Day[];
  recipeId: string;
  /** Each day's own run of meals, so Monday can offer what Monday holds. */
  shapes: WeekShape;
  slots: MealSlot[];
  weekStart: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [dayIndex, setDayIndex] = useState(days[0]?.index ?? 0);
  const [chosen, setChosen] = useState(0);

  const shape = shapes[dayIndex] ?? [];
  // Only the places this recipe suits: a breakfast recipe should not offer to be
  // dinner just because the day has one.
  const places = shape
    .map((slot, slotIndex) => ({ slot, slotIndex }))
    .filter((place) => slots.includes(place.slot));
  const place = places.find((entry) => entry.slotIndex === chosen) ?? places[0];

  if (shapes.every((entry) => !entry.some((slot) => slots.includes(slot)))) {
    return null;
  }

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
            onChange={(value) => {
              setDayIndex(Number(value));
              setChosen(0);
            }}
            options={days.map((day) => ({
              id: String(day.index),
              label: `${day.label} · ${day.dateLabel}`,
              textValue: `${day.label}, ${day.dateLabel}`,
            }))}
          />

          {/* The index identifies the meal; its type rides along so the row records
              what kind of meal it is without a second lookup. */}
          <input name="slot" type="hidden" value={place?.slot ?? ""} />
          <SelectField
            label="Meal"
            name="slotIndex"
            onChange={(value) => setChosen(Number(value))}
            options={places.map((entry) => ({
              id: String(entry.slotIndex),
              label: mealLabel(shape, entry.slotIndex),
            }))}
            selectedKey={String(place?.slotIndex ?? "")}
          />

          <PendingButton className="w-full">Add to plan</PendingButton>
        </form>
      </AppDialog>
    </>
  );
}
