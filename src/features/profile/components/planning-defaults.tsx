"use client";

import { useState } from "react";
import { Input, Label, TextField, Typography } from "@heroui/react";

import { CheckChip } from "@/components/ui/check-chip";
import {
  buildDay,
  MAX_MEALS_PER_DAY,
  mealLabel,
} from "@/features/planner/day-shape";
import { MEAL_SLOTS, type MealSlot } from "@/features/recipes/recipe.schema";

/**
 * How many meals a day holds, and which kinds.
 *
 * The count is not independent of the toggles: it is the kinds you chose plus however
 * many extra meals you asked for on top. So turning breakfast off takes one meal away
 * rather than leaving a number that no longer describes anything, while a day of four
 * kinds and eight meals keeps its four extras when one kind goes.
 */
export function PlanningDefaults({ day }: { day: MealSlot[] }) {
  const initialTypes = MEAL_SLOTS.filter((slot) => day.includes(slot));
  const [types, setTypes] = useState<MealSlot[]>(
    initialTypes.length > 0 ? initialTypes : [...MEAL_SLOTS],
  );
  const [extras, setExtras] = useState(
    Math.max(day.length - initialTypes.length, 0),
  );

  const mealsPerDay = Math.min(types.length + extras, MAX_MEALS_PER_DAY);
  const shape = buildDay(types, mealsPerDay);

  function toggle(slot: MealSlot, on: boolean) {
    setTypes((current) =>
      MEAL_SLOTS.filter((entry) =>
        entry === slot ? on : current.includes(entry),
      ),
    );
  }

  return (
    <>
      <div className="grid items-start gap-5 sm:grid-cols-[12rem_1fr]">
        <TextField
          isRequired
          name="defaultMealsPerDay"
          onChange={(value) => {
            const wanted = Number(value);

            setExtras(
              Number.isFinite(wanted) ? Math.max(wanted - types.length, 0) : 0,
            );
          }}
          type="number"
          value={String(mealsPerDay)}
        >
          <Label>Meals per day</Label>
          <Input max={MAX_MEALS_PER_DAY} min={1} />
        </TextField>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium text-foreground">
            Kinds of meal
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {MEAL_SLOTS.map((slot) => (
              <CheckChip
                checked={types.includes(slot)}
                key={slot}
                label={slot}
                name="defaultMealTypes"
                onChange={(on) => toggle(slot, on)}
                value={slot}
              />
            ))}
          </div>
        </fieldset>
      </div>

      {/* Asking for more meals than kinds repeats the later ones, which is worth
          showing rather than leaving to be discovered in the planner. */}
      <Typography color="muted" type="body-sm">
        {shape.length === 0
          ? "Choose at least one kind of meal."
          : `A day runs ${shape.map((_, index) => mealLabel(shape, index)).join(", ")}.`}
      </Typography>
    </>
  );
}
