"use client";

import { useActionState } from "react";
import {
  Button,
  Card,
  Description,
  Input,
  Label,
  TextArea,
  TextField,
} from "@heroui/react";

import { FormMessage } from "@/components/ui/form-message";
import { CheckChip } from "@/components/ui/check-chip";
import { ContentCard } from "@/components/ui/content-card";
import { ImagePicker } from "@/components/ui/image-picker";
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
  collectionTags: string[];
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
  collectionTags: [],
};

type RecipeFormProps = {
  knownCollections?: string[];
  action: (
    state: RecipeFormState,
    formData: FormData,
  ) => Promise<RecipeFormState>;
  submitLabel: string;
  values?: RecipeFormValues;
};

export function RecipeForm({
  action,
  knownCollections = [],
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
            <PanelTitle level={2}>Steps</PanelTitle>
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

        <ImagePicker
          accept={IMAGE_TYPES.join(",")}
          currentUrl={values.imageUrl}
          help="Optional · JPEG, PNG, WebP or AVIF · 5MB max"
          label="Photograph"
          name="image"
        />

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
          <div className="grid grid-cols-2 gap-2">
            {MEAL_SLOTS.map((slot) => (
              <CheckChip
                defaultChecked={values.mealTags.includes(slot)}
                key={slot}
                label={slot}
                name="mealTags"
                value={slot}
              />
            ))}
          </div>
        </fieldset>

        <TextField
          defaultValue={values.collectionTags.join(", ")}
          name="collectionTags"
        >
          <Label>Collections</Label>
          <Input
            list="known-collections"
            placeholder="Asian, quick, family favorites"
          />
          <Description>
            {knownCollections.length > 0
              ? `Optional · separate names with commas. Already in use: ${knownCollections.slice(0, 6).join(", ")}`
              : "Optional · separate collection names with commas."}
          </Description>
          <datalist id="known-collections">
            {knownCollections.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </TextField>

        <Button className="w-full" isPending={isPending} type="submit">
          {isPending ? "Saving…" : submitLabel}
        </Button>
      </ContentCard>
    </form>
  );
}
