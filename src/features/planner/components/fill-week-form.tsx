"use client";

import { useActionState } from "react";
import { Label, ListBox, Select, Typography } from "@heroui/react";

import { ActionButton } from "@/components/ui/action";

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
  compact?: boolean;
  enabledSlots: ReadonlyArray<MealSlot>;
  lists: ReadonlyArray<{ id: string; name: string }>;
  targetListId: string | null;
  weekStart: string;
};

export function FillWeekForm({
  compact = false,
  enabledSlots,
  lists,
  targetListId,
  weekStart,
}: FillWeekFormProps) {
  const [state, formAction, isPending] = useActionState<
    PlannerFormState,
    FormData
  >(generateWeekPlan, {});

  if (compact) {
    return (
      <form action={formAction}>
        <input name="weekStart" type="hidden" value={weekStart} />
        <input name="source" type="hidden" value="both" />
        {enabledSlots.map((slot) => (
          <input key={slot} name="slots" type="hidden" value={slot} />
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
      </div>

      {lists.length > 0 ? (
        <div className="flex max-w-sm flex-col gap-1">
          <Label id="shoppingList">Shopping list</Label>
          <Select
            aria-labelledby="shoppingList"
            defaultSelectedKey={targetListId ?? lists[0]?.id}
            name="listId"
          >
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {lists.map((list) => (
                  <ListBox.Item
                    id={list.id}
                    key={list.id}
                    textValue={list.name}
                  >
                    {list.name}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
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
