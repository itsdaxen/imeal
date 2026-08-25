"use client";

import { useActionState, useState } from "react";
import { Button, Label, TextArea, TextField, Typography } from "@heroui/react";

import { FormMessage } from "@/features/auth/components/form-message";
import {
  RecipeForm,
  type RecipeFormValues,
} from "@/features/recipes/components/recipe-form";
import { createRecipe } from "@/features/recipes/recipe.actions";
import { TagList } from "@/components/ui/tag-list";

import { draftRecipe, type RecipeDraftState } from "../ai.actions";
import { MAX_PASTED_CHARACTERS, type DraftRecipe } from "../draft-recipe";

function toFormValues(draft: DraftRecipe): RecipeFormValues {
  return {
    imageUrl: null,
    title: draft.title,
    ingredients: draft.ingredients.join("\n"),
    steps: draft.steps.join("\n"),
    tip: draft.tip ?? "",
    prepMinutes: draft.prepMinutes,
    servings: draft.servings,
    mealTags: draft.mealTags,
  };
}

export function RecipeImport() {
  const [state, formAction, isPending] = useActionState<
    RecipeDraftState,
    FormData
  >(draftRecipe, {});
  const [accepted, setAccepted] = useState<DraftRecipe | null>(null);

  if (accepted) {
    return (
      <div className="flex flex-col gap-6">
        <FormMessage tone="notice">
          Read from your paste. Check it over before you save.
        </FormMessage>

        <RecipeForm
          action={createRecipe}
          submitLabel="Save recipe"
          values={toFormValues(accepted)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <form action={formAction} className="flex flex-col gap-4">
        {state.error ? (
          <FormMessage tone="error">{state.error}</FormMessage>
        ) : null}

        <TextField>
          <Label htmlFor="text">Paste a recipe</Label>
          <TextArea
            id="text"
            maxLength={MAX_PASTED_CHARACTERS}
            name="text"
            placeholder={
              "Roast chicken\nServes 4 · 90 minutes\n\nIngredients\n1 chicken\n…"
            }
            rows={12}
          />
        </TextField>

        <Button className="self-start" isPending={isPending} type="submit">
          Read it
        </Button>
      </form>

      {state.draft ? (
        <section
          aria-labelledby="draft-heading"
          className="flex flex-col gap-4"
        >
          <Typography id="draft-heading" type="h2" weight="semibold">
            {state.draft.title}
          </Typography>

          <Typography className="text-muted" type="body-sm">
            {state.draft.servings} servings · {state.draft.prepMinutes} minutes
          </Typography>

          <TagList label="Meals" tags={state.draft.mealTags} />

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Typography type="body-sm" weight="medium">
                Ingredients
              </Typography>
              <ul className="flex list-disc flex-col gap-1 pl-5">
                {state.draft.ingredients.map((ingredient) => (
                  <li key={ingredient}>
                    <Typography type="body-sm">{ingredient}</Typography>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <Typography type="body-sm" weight="medium">
                Method
              </Typography>
              <ol className="flex list-decimal flex-col gap-1 pl-5">
                {state.draft.steps.map((step) => (
                  <li key={step}>
                    <Typography type="body-sm">{step}</Typography>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {state.draft.tip ? (
            <Typography className="text-muted" type="body-sm">
              Tip: {state.draft.tip}
            </Typography>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button onPress={() => setAccepted(state.draft ?? null)}>
              Use this draft
            </Button>
            <Typography className="self-center text-muted" type="body-sm">
              Nothing is saved until you press save on the form.
            </Typography>
          </div>
        </section>
      ) : null}
    </div>
  );
}
