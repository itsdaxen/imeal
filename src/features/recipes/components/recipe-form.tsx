"use client";

import { useActionState } from "react";
import Image from "next/image";
import {
  Button,
  Card,
  Description,
  Input,
  Label,
  TextArea,
  TextField,
} from "@heroui/react";

import { FormMessage } from "@/features/auth/components/form-message";
import { ContentCard } from "@/components/ui/content-card";
import { PanelTitle } from "@/components/ui/panel-title";

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
    <form
      action={formAction}
      className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]"
    >
      {state.error ? (
        <div className="lg:col-span-2">
          <FormMessage tone="error">{state.error}</FormMessage>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col gap-6">
        <ContentCard className="gap-5" density="spacious">
          <Card.Header className="flex-col items-start gap-1 p-0">
            <PanelTitle level={2}>The recipe</PanelTitle>
            <Card.Description>
              Give it a name you will recognize and a practical ingredient list.
            </Card.Description>
          </Card.Header>
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
            <TextArea
              placeholder={
                "250 g pasta\n400 g chopped tomatoes\n1 handful fresh basil"
              }
              rows={7}
            />
            <Description>Put each ingredient on its own line.</Description>
          </TextField>
        </ContentCard>

        <ContentCard className="gap-5" density="spacious">
          <Card.Header className="flex-col items-start gap-1 p-0">
            <PanelTitle level={2}>Method</PanelTitle>
            <Card.Description>
              Keep each instruction focused so it is easy to follow while
              cooking.
            </Card.Description>
          </Card.Header>
          <TextField defaultValue={values.steps} isRequired name="steps">
            <Label>Steps</Label>
            <TextArea
              placeholder={
                "Boil the pasta until al dente.\nSimmer the tomatoes with seasoning.\nToss together and finish with basil."
              }
              rows={9}
            />
            <Description>Put each step on its own line, in order.</Description>
          </TextField>
          <TextField defaultValue={values.tip} name="tip">
            <Label>Cook&apos;s note</Label>
            <TextArea
              placeholder="A useful substitution or serving idea."
              rows={3}
            />
            <Description>Optional.</Description>
          </TextField>
        </ContentCard>
      </div>

      <ContentCard className="gap-5 lg:sticky lg:top-24" density="spacious">
        <Card.Header className="flex-col items-start gap-1 p-0">
          <PanelTitle level={2}>Finishing details</PanelTitle>
          <Card.Description>
            Help iMeal place and scale this recipe later.
          </Card.Description>
        </Card.Header>

        <div className="flex flex-col gap-2">
          <Label htmlFor="image">Photograph</Label>
          {values.imageUrl ? (
            <Image
              alt="Current recipe photograph"
              className="aspect-4/3 w-full rounded-2xl object-cover"
              height={228}
              src={values.imageUrl}
              width={304}
            />
          ) : null}
          <div className="rounded-2xl border border-dashed border-border bg-surface-secondary p-4">
            <input
              accept={IMAGE_TYPES.join(",")}
              className="max-w-full text-sm file:mr-3 file:min-h-11 file:rounded-full file:border-0 file:bg-default file:px-4 file:text-sm file:font-medium file:text-foreground"
              id="image"
              name="image"
              type="file"
            />
          </div>
          <span className="text-xs text-muted">
            Optional · JPEG, PNG, WebP or AVIF · 5MB max
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TextField
            defaultValue={String(values.prepMinutes)}
            isRequired
            name="prepMinutes"
            type="number"
          >
            <Label>Minutes</Label>
            <Input max={1440} min={1} />
          </TextField>

          <TextField
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
          <legend className="text-sm font-medium text-foreground">
            Works well for
          </legend>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            {MEAL_SLOTS.map((slot) => (
              <label
                className="flex min-h-11 items-center gap-2 text-sm capitalize"
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

        <Button className="w-full" isPending={isPending} type="submit">
          {isPending ? "Saving…" : submitLabel}
        </Button>
      </ContentCard>
    </form>
  );
}
