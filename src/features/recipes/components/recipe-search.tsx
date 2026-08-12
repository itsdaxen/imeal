import { Button, Input, Label, TextField } from "@heroui/react";

import { MEAL_SLOTS, type MealSlot } from "../recipe.schema";

type RecipeSearchProps = {
  mealTag?: MealSlot;
  search?: string;
};

export function RecipeSearch({ mealTag, search }: RecipeSearchProps) {
  return (
    <form
      action="/recipes"
      className="flex flex-wrap items-end gap-3"
      role="search"
    >
      <TextField
        className="min-w-56 flex-1"
        defaultValue={search}
        name="search"
      >
        <Label>Search recipes</Label>
        <Input placeholder="Title contains…" type="search" />
      </TextField>

      <div className="flex flex-col gap-1">
        <Label htmlFor="mealTag">Meal</Label>
        <select
          className="h-10 rounded-xl border border-border bg-surface px-3 text-sm"
          defaultValue={mealTag ?? ""}
          id="mealTag"
          name="mealTag"
        >
          <option value="">Any</option>
          {MEAL_SLOTS.map((slot) => (
            <option className="capitalize" key={slot} value={slot}>
              {slot}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" variant="tertiary">
        Filter
      </Button>
    </form>
  );
}
