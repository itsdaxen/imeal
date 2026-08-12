"use client";

import { useActionState } from "react";
import {
  Button,
  Description,
  Input,
  Label,
  TextArea,
  TextField,
} from "@heroui/react";

import { FormMessage } from "@/features/auth/components/form-message";

import type { RecipeFormState } from "../recipe.actions";
import { MEAL_SLOTS, type MealSlot } from "../recipe.schema";

export type RecipeFormValues = {
  title: string;
  ingredients: string;
  steps: string;
  tip: string;
  prepMinutes: number;
  servings: number;
  mealTags: MealSlot[];
};

const EMPTY: RecipeFormValues = {
  title: "",
  ingredients: "",
  steps: "",
  tip: "",
  prepMinutes: 30,
  servings: 4,
  mealTags: ["dinner"],
};

type RecipeFormProps = {
  action: (
    state: RecipeFormState,
    formData: FormData,
  ) => Promise<RecipeFormState>;
  submitLabel: string;
  values?: RecipeFormValues;
};

export function RecipeForm({
  action,
  submitLabel,
  values = EMPTY,
}: RecipeFormProps) {
  const [state, formAction, isPending] = useActionState<
    RecipeFormState,
    FormData
  >(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.error ? (
        <FormMessage tone="error">{state.error}</FormMessage>
      ) : null}

      <TextField defaultValue={values.title} isRequired name="title">
        <Label>Title</Label>
        <Input placeholder="Tomato and basil pasta" />
      </TextField>

      <TextField
        defaultValue={values.ingredients}
        isRequired
        name="ingredients"
      >
        <Label>Ingredients</Label>
        <TextArea rows={6} />
        <Description>One per line.</Description>
      </TextField>

      <TextField defaultValue={values.steps} isRequired name="steps">
        <Label>Steps</Label>
        <TextArea rows={8} />
        <Description>One per line, in order.</Description>
      </TextField>

      <TextField defaultValue={values.tip} name="tip">
        <Label>Tip</Label>
        <TextArea rows={2} />
        <Description>Optional.</Description>
      </TextField>

      <div className="flex flex-wrap gap-5">
        <TextField
          className="w-40"
          defaultValue={String(values.prepMinutes)}
          isRequired
          name="prepMinutes"
          type="number"
        >
          <Label>Prep minutes</Label>
          <Input max={1440} min={1} />
        </TextField>

        <TextField
          className="w-40"
          defaultValue={String(values.servings)}
          isRequired
          name="servings"
          type="number"
        >
          <Label>Servings</Label>
          <Input max={100} min={1} />
        </TextField>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-foreground">Suits</legend>
        <div className="flex flex-wrap gap-4">
          {MEAL_SLOTS.map((slot) => (
            <label
              className="flex min-h-11 items-center gap-2 pr-3 text-sm capitalize"
              key={slot}
            >
              <input
                className="size-4 accent-accent"
                defaultChecked={values.mealTags.includes(slot)}
                name="mealTags"
                type="checkbox"
                value={slot}
              />
              {slot}
            </label>
          ))}
        </div>
      </fieldset>

      <Button className="self-start" isPending={isPending} type="submit">
        {isPending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
