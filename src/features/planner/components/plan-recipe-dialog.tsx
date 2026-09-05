"use client";

import { useState } from "react";
import { Button, Label, ListBox, Select } from "@heroui/react";

import { ActionButton } from "@/components/ui/action";
import type { MealSlot } from "@/features/recipes/recipe.schema";

import { assignRecipeToSlot } from "../plan.actions";
import { AppDialog } from "@/components/ui/app-dialog";

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
        <form action={assignRecipeToSlot} className="flex flex-col gap-5">
          <input name="recipeId" type="hidden" value={recipeId} />
          <input name="weekStart" type="hidden" value={weekStart} />

          <Select defaultSelectedKey={String(days[0].index)} name="dayIndex">
            <Label>Day</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {days.map((day) => (
                  <ListBox.Item
                    id={String(day.index)}
                    key={day.index}
                    textValue={`${day.label}, ${day.dateLabel}`}
                  >
                    {day.label} · {day.dateLabel}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <Select defaultSelectedKey={slots[0]} name="slot">
            <Label>Meal</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {slots.map((slot) => (
                  <ListBox.Item
                    id={slot}
                    key={slot}
                    textValue={SLOT_LABELS[slot]}
                  >
                    {SLOT_LABELS[slot]}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <Button className="w-full" type="submit">
            Add to plan
          </Button>
        </form>
      </AppDialog>
    </>
  );
}
