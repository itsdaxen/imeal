"use client";

import { useActionState, useState } from "react";
import {
  Button,
  Card,
  Label,
  TextArea,
  TextField,
  Typography,
} from "@heroui/react";

import { FormMessage } from "@/features/auth/components/form-message";
import {
  RecipeForm,
  type RecipeFormValues,
} from "@/features/recipes/components/recipe-form";
import { createRecipe } from "@/features/recipes/recipe.actions";
import { TagList } from "@/components/ui/tag-list";
import { ContentCard } from "@/components/ui/content-card";

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
  const [characterCount, setCharacterCount] = useState(0);

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
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <ContentCard density="spacious">
        <Card.Header className="flex-col items-start gap-1 p-0">
          <Typography type="h2" weight="semibold">
            Paste the whole recipe
          </Typography>
          <Typography className="text-muted" type="body-sm">
            Copied webpage text, notes, or rough instructions all work.
          </Typography>
        </Card.Header>
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
              onChange={(event) =>
                setCharacterCount(event.currentTarget.value.length)
              }
              placeholder={
                "Roast chicken\nServes 4 · 90 minutes\n\nIngredients\n1 chicken\n…"
              }
              rows={15}
            />
          </TextField>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Typography className="text-muted" type="body-sm">
              {characterCount.toLocaleString()} /{" "}
              {MAX_PASTED_CHARACTERS.toLocaleString()} characters
            </Typography>
            <Button isPending={isPending} type="submit">
              {isPending ? "Reading…" : "Create a draft"}
            </Button>
          </div>
        </form>
      </ContentCard>

      <ContentCard className="gap-5" density="spacious">
        <Card.Header className="flex-col items-start gap-1 p-0">
          <Typography type="h2" weight="semibold">
            You stay in control
          </Typography>
          <Typography className="text-muted" type="body-sm">
            Importing prepares an editable draft. It never saves behind your
            back.
          </Typography>
        </Card.Header>
        <ol className="flex list-none flex-col gap-5 p-0">
          {[
            ["1", "Paste", "Include the title, ingredients, and method."],
            [
              "2",
              "Review",
              "Check the structured recipe and make corrections.",
            ],
            ["3", "Save", "Add the finished version to your recipes."],
          ].map(([number, title, detail]) => (
            <li className="grid grid-cols-[2rem_1fr] gap-3" key={number}>
              <span className="flex size-8 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                {number}
              </span>
              <div>
                <p className="font-medium text-foreground">{title}</p>
                <p className="text-sm text-muted">{detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </ContentCard>

      {state.draft ? (
        <section
          aria-labelledby="draft-heading"
          className="flex flex-col gap-4 rounded-3xl border border-border/80 bg-surface p-6 lg:col-span-2 lg:p-8"
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
