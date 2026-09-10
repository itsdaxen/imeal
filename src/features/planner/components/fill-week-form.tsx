"use client";

import { useActionState } from "react";
import { Typography } from "@heroui/react";

import { ActionButton } from "@/components/ui/action";

import { FormMessage } from "@/components/ui/form-message";
import { MEAL_SLOTS, type MealSlot } from "@/features/recipes/recipe.schema";

import { generateWeekPlan, type PlannerFormState } from "../plan.actions";
import { GENERATION_SOURCES } from "../plan.schema";
import { SelectField } from "@/components/ui/select-field";

const SOURCE_LABEL: Record<(typeof GENERATION_SOURCES)[number], string> = {
  mine: "My recipes",
  catalog: "The catalog",
  both: "Both",
};

type FillWeekFormProps = {
  compact?: boolean;
  day: ReadonlyArray<MealSlot>;
  lists: ReadonlyArray<{
    id: string;
    isDefault: boolean;
    isOwn: boolean;
    name: string;
  }>;
  targetListId: string | null;
  weekStart: string;
};

export function FillWeekForm({
  compact = false,
  day,
  lists,
  targetListId,
  weekStart,
}: FillWeekFormProps) {
  // Your own default, ahead of whatever this week already points at: the week's target
  // is often something nothing ever chose on purpose, and `is_default` belongs to a
  // list's owner, so a list shared with you can carry someone else's.
  const yourDefault = lists.find((list) => list.isDefault && list.isOwn);
  const [state, formAction, isPending] = useActionState<
    PlannerFormState,
    FormData
  >(generateWeekPlan, {});

  if (compact) {
    return (
      <form action={formAction}>
        <input name="weekStart" type="hidden" value={weekStart} />
        <input name="source" type="hidden" value="both" />
        {/* Keyed by position: the day repeats types, so the type is not unique. */}
        {day.map((slot, slotIndex) => (
          <input key={slotIndex} name="slots" type="hidden" value={slot} />
        ))}
        {targetListId ? (
          <input name="listId" type="hidden" value={targetListId} />
        ) : null}
        <ActionButton isPending={isPending} tier="primary" type="submit">
          {isPending ? "Generating…" : "Generate plan"}
        </ActionButton>
      </form>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input name="weekStart" type="hidden" value={weekStart} />

      {state.error ? (
        <FormMessage tone="error">{state.error}</FormMessage>
      ) : null}

      <div className="flex flex-col gap-5 md:flex-row md:flex-wrap md:gap-8">
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

        {/* The checkboxes carry the kinds; this carries how many meals a day holds,
            which the kinds alone cannot say once a day repeats one of them. */}
        <input name="mealsPerDay" type="hidden" value={day.length} />

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-foreground">
            Kinds of meal
          </legend>
          <div className="flex flex-wrap gap-4">
            {MEAL_SLOTS.map((slot) => (
              <label
                className="flex min-h-11 items-center gap-2 pr-3 text-sm capitalize"
                key={slot}
              >
                <input
                  className="size-4 accent-accent"
                  defaultChecked={day.includes(slot)}
                  name="slots"
                  type="checkbox"
                  value={slot}
                />
                {slot}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {lists.length > 0 ? (
        <div className="flex max-w-sm flex-col gap-1">
          <SelectField
            defaultSelectedKey={yourDefault?.id ?? targetListId ?? lists[0]?.id}
            label="Shopping list"
            name="listId"
            options={lists.map((list) => ({
              id: list.id,
              label:
                list.isDefault && list.isOwn
                  ? `${list.name} · default`
                  : list.name,
            }))}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-4 border-t border-separator pt-4">
        <ActionButton isPending={isPending} tier="neutral" type="submit">
          {isPending ? "Generating…" : "Generate plan"}
        </ActionButton>
        <Typography color="muted" type="body-sm">
          Existing generated meals are replaced. The selected list becomes this
          week&apos;s shopping destination.
        </Typography>
      </div>
    </form>
  );
}
