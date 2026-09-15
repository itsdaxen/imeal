"use client";

import { useState } from "react";
import { Input, Label, TextField } from "@heroui/react";

import { CheckChip } from "@/components/ui/check-chip";
import { MAX_MEALS_PER_DAY } from "@/features/planner/day-shape";
import { MEAL_SLOTS, type MealSlot } from "@/features/recipes/recipe.schema";

export function MealTypeChoices({
  name = "defaultMealTypes",
  onChange,
  types,
}: {
  name?: string;
  onChange: (slot: MealSlot, checked: boolean) => void;
  types: MealSlot[];
}) {
  return (
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
            name={name}
            onChange={(checked) => onChange(slot, checked)}
            value={slot}
          />
        ))}
      </div>
    </fieldset>
  );
}

export function MealsPerDayField({
  min = 1,
  name = "defaultMealsPerDay",
  onChange,
  value,
}: {
  min?: number;
  name?: string;
  onChange: (value: number) => void;
  value: number;
}) {
  // Empty is a real editing state: immediately replacing it with the previous number
  // makes typing `4` after clearing `3` produce `34`. Null follows the parent value.
  const [draft, setDraft] = useState<string | null>(null);
  const inputValue = draft ?? String(value);

  return (
    <TextField
      isRequired
      name={name}
      onBlur={() => {
        if (inputValue === "") setDraft(null);
      }}
      onChange={(next) => {
        if (next === "") {
          setDraft("");
        } else {
          setDraft(null);
          onChange(Number(next));
        }
      }}
      type="number"
      value={inputValue}
    >
      <Label>Meals per day</Label>
      <Input max={MAX_MEALS_PER_DAY} min={min} />
    </TextField>
  );
}
