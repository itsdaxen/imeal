"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { ActionButton } from "@/components/ui/action";
import { AppDialog, closing } from "@/components/ui/app-dialog";
import { PendingButton } from "@/components/ui/pending-button";
import { SelectField } from "@/components/ui/select-field";
import { MEAL_SLOTS, type MealSlot } from "@/features/recipes/recipe.schema";

import { addMealToDay } from "../plan.actions";

const TITLE: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  dinner: "Dinner",
  lunch: "Lunch",
  snack: "Snack",
};

/**
 * One more meal than the day currently holds.
 *
 * The kind is asked for rather than assumed, because an extra meal is usually a second
 * dinner or a second lunch and never a second breakfast — but that is a guess, and the
 * recipes a slot can hold depend on getting it right.
 */
export function AddMealButton({ weekStart }: { weekStart: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [slot, setSlot] = useState<MealSlot>("dinner");

  return (
    <>
      <ActionButton
        className="w-full justify-center"
        onPress={() => setIsOpen(true)}
        tier="neutral"
      >
        <Plus aria-hidden="true" className="size-4" />
        Add a meal
      </ActionButton>

      <AppDialog
        heading="Add a meal to every day"
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      >
        <form
          action={closing(addMealToDay, () => setIsOpen(false))}
          className="flex flex-col gap-5"
        >
          <input name="weekStart" type="hidden" value={weekStart} />
          <input name="slot" type="hidden" value={slot} />

          <SelectField
            label="What kind of meal"
            onChange={(value) => setSlot(value as MealSlot)}
            options={MEAL_SLOTS.map((entry) => ({
              id: entry,
              label: TITLE[entry],
            }))}
            selectedKey={slot}
          />

          <PendingButton className="w-full">Add the meal</PendingButton>
        </form>
      </AppDialog>
    </>
  );
}
