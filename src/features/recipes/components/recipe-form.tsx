"use client";

import { useActionState } from "react";
import Image from "next/image";
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
import { IMAGE_TYPES } from "@/features/images/image";

import { MEAL_SLOTS, type MealSlot } from "../recipe.schema";

export type RecipeFormValues = {
  imageUrl?: string | null;
  title: string;
  ingredients: string;
  steps: string;
  tip: string;
  prepMinutes: number;
  servings: number;
  mealTags: MealSlot[];
};

const EMPTY: RecipeFormValues = {
  imageUrl: null,
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="image">Photograph</Label>
        {values.imageUrl ? (
          <Image
            alt=""
            className="aspect-4/3 w-full max-w-64 rounded-2xl object-cover"
            height={192}
            src={values.imageUrl}
            width={256}
          />
        ) : null}
        <input
          accept={IMAGE_TYPES.join(",")}
          className="max-w-full text-sm file:mr-3 file:min-h-11 file:rounded-full file:border-0 file:bg-default file:px-4 file:text-sm file:font-medium file:text-foreground"
          id="image"
          name="image"
          type="file"
        />
        <span className="text-sm text-muted">
          Optional. JPEG, PNG, WebP or AVIF, up to 5MB.
        </span>
      </div>

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
