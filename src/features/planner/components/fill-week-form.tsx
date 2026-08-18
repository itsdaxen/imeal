"use client";

import { useActionState } from "react";
import { Button, Typography } from "@heroui/react";

import { FormMessage } from "@/features/auth/components/form-message";
import { MEAL_SLOTS, type MealSlot } from "@/features/recipes/recipe.schema";

import { generateWeekPlan, type PlannerFormState } from "../plan.actions";
import { GENERATION_SOURCES } from "../plan.schema";

const SOURCE_LABEL: Record<(typeof GENERATION_SOURCES)[number], string> = {
  mine: "My recipes",
  catalog: "The catalog",
  both: "Both",
};

type FillWeekFormProps = {
  enabledSlots: ReadonlyArray<MealSlot>;
  weekStart: string;
};

export function FillWeekForm({ enabledSlots, weekStart }: FillWeekFormProps) {
  const [state, formAction, isPending] = useActionState<
    PlannerFormState,
    FormData
  >(generateWeekPlan, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input name="weekStart" type="hidden" value={weekStart} />

      {state.error ? (
        <FormMessage tone="error">{state.error}</FormMessage>
      ) : null}

      <div className="flex flex-wrap items-end gap-6">
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-foreground">
            Fill from
          </legend>
          <div className="flex flex-wrap gap-4">
            {GENERATION_SOURCES.map((source) => (
              <label
                className="flex min-h-11 items-center gap-2 pr-3 text-sm"
                key={source}
              >
                <input
                  className="size-4 accent-accent"
                  defaultChecked={source === "both"}
                  name="source"
                  type="radio"
                  value={source}
                />
                {SOURCE_LABEL[source]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-foreground">Slots</legend>
          <div className="flex flex-wrap gap-4">
            {MEAL_SLOTS.map((slot) => (
              <label
                className="flex min-h-11 items-center gap-2 pr-3 text-sm capitalize"
                key={slot}
              >
                <input
                  className="size-4 accent-accent"
                  defaultChecked={enabledSlots.includes(slot)}
                  name="slots"
                  type="checkbox"
                  value={slot}
                />
                {slot}
              </label>
            ))}
          </div>
        </fieldset>

        <Button isPending={isPending} type="submit">
          {isPending ? "Filling…" : "Fill the week"}
        </Button>
      </div>

      <Typography className="text-muted" type="body-xs">
        Approved meals stay where they are. Everything else is replaced.
      </Typography>
    </form>
  );
}
