"use client";

import {
  createContext,
  type ReactNode,
  useActionState,
  useContext,
  useState,
} from "react";
import { Typography } from "@heroui/react";

import { ActionButton } from "@/components/ui/action";

import { FormMessage } from "@/components/ui/form-message";
import { MEAL_SLOTS, type MealSlot } from "@/features/recipes/recipe.schema";

import { generateWeekPlan, type PlannerFormState } from "../plan.actions";
import { GENERATION_SOURCES } from "../plan.schema";
import type { GenerationSource } from "../plan.schema";
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

type GenerationSettings = {
  listId: string | null;
  setListId: (listId: string) => void;
  setSource: (source: GenerationSource) => void;
  setSlot: (slot: MealSlot, selected: boolean) => void;
  slots: MealSlot[];
  source: GenerationSource;
};

const GenerationSettingsContext = createContext<GenerationSettings | null>(
  null,
);

export function PlanGenerationSettingsProvider({
  children,
  day,
  targetListId,
}: {
  children: ReactNode;
  day: ReadonlyArray<MealSlot>;
  targetListId: string | null;
}) {
  const [source, setSource] = useState<GenerationSource>("both");
  const [slots, setSlots] = useState<MealSlot[]>(() =>
    MEAL_SLOTS.filter((slot) => day.includes(slot)),
  );
  const [listId, setListId] = useState(targetListId);

  function setSlot(slot: MealSlot, selected: boolean) {
    setSlots((current) =>
      selected
        ? MEAL_SLOTS.filter(
            (candidate) => current.includes(candidate) || candidate === slot,
          )
        : current.filter((candidate) => candidate !== slot),
    );
  }

  return (
    <GenerationSettingsContext.Provider
      value={{ listId, setListId, setSlot, setSource, slots, source }}
    >
      {children}
    </GenerationSettingsContext.Provider>
  );
}

function useGenerationSettings(
  day: ReadonlyArray<MealSlot>,
  listId: string | null,
) {
  const shared = useContext(GenerationSettingsContext);

  return (
    shared ?? {
      listId,
      setListId: () => undefined,
      setSlot: () => undefined,
      setSource: () => undefined,
      slots: MEAL_SLOTS.filter((slot) => day.includes(slot)),
      source: "both" as const,
    }
  );
}

export function FillWeekForm({
  compact = false,
  day,
  lists,
  targetListId,
  weekStart,
}: FillWeekFormProps) {
  const [state, formAction, isPending] = useActionState<
    PlannerFormState,
    FormData
  >(generateWeekPlan, {});
  const settings = useGenerationSettings(day, targetListId);

  if (compact) {
    return (
      <form action={formAction}>
        <input name="weekStart" type="hidden" value={weekStart} />
        <input name="source" type="hidden" value={settings.source} />
        {settings.slots.map((slot) => (
          <input key={slot} name="slots" type="hidden" value={slot} />
        ))}
        {settings.listId ? (
          <input name="listId" type="hidden" value={settings.listId} />
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
                  checked={settings.source === source}
                  name="source"
                  onChange={() => settings.setSource(source)}
                  type="radio"
                  value={source}
                />
                {SOURCE_LABEL[source]}
              </label>
            ))}
          </div>
        </fieldset>

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
                  checked={settings.slots.includes(slot)}
                  name="slots"
                  onChange={(event) =>
                    settings.setSlot(slot, event.currentTarget.checked)
                  }
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
            label="Shopping list"
            name="listId"
            onChange={settings.setListId}
            options={lists.map((list) => ({
              id: list.id,
              label:
                list.isDefault && list.isOwn
                  ? `${list.name} · default`
                  : list.name,
            }))}
            selectedKey={settings.listId ?? lists[0]?.id}
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
