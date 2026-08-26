import {
  Button,
  Input,
  Label,
  ListBox,
  Select,
  TextField,
} from "@heroui/react";

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
        <Label id="mealTag">Meal</Label>
        <Select
          aria-labelledby="mealTag"
          className="w-40"
          defaultSelectedKey={mealTag ?? "any"}
          name="mealTag"
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="any" textValue="Any">
                Any
              </ListBox.Item>
              {MEAL_SLOTS.map((slot) => (
                <ListBox.Item
                  className="capitalize"
                  id={slot}
                  key={slot}
                  textValue={slot}
                >
                  {slot}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      <Button type="submit" variant="tertiary">
        Filter
      </Button>
    </form>
  );
}
