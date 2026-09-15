"use client";

import {
  createContext,
  type ReactNode,
  useActionState,
  useContext,
  useEffect,
  useState,
} from "react";
import { Typography, toast } from "@heroui/react";

import { ActionButton } from "@/components/ui/action";

import { MEAL_SLOTS, type MealSlot } from "@/features/recipes/recipe.schema";
import {
  MealsPerDayField,
  MealTypeChoices,
} from "@/features/profile/components/planning-default-fields";

import { generateWeekPlan, type PlannerFormState } from "../plan.actions";
import { GENERATION_SOURCES } from "../plan.schema";
import type { GenerationSource } from "../plan.schema";
import { SelectField } from "@/components/ui/select-field";
import { buildDay, MAX_MEALS_PER_DAY, mealLabel } from "../day-shape";

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
  mealsPerDay: number;
  setListId: (listId: string) => void;
  setMealsPerDay: (meals: number) => void;
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
  const [extras, setExtras] = useState(() =>
    Math.max(day.length - new Set(day).size, 0),
  );
  const [listId, setListId] = useState(targetListId);
  const mealsPerDay = Math.min(slots.length + extras, MAX_MEALS_PER_DAY);

  function setMealsPerDay(meals: number) {
    setExtras(Number.isFinite(meals) ? Math.max(meals - slots.length, 0) : 0);
  }

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
      value={{
        listId,
        mealsPerDay,
        setListId,
        setMealsPerDay,
        setSlot,
        setSource,
        slots,
        source,
      }}
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
      mealsPerDay: day.length,
      setListId: () => undefined,
      setMealsPerDay: () => undefined,
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

  // Raised rather than printed: either form can fail, the compact one is a lone
  // button with nowhere to put a sentence, and a week that could not be filled is
  // news — not a note to find later.
  useEffect(() => {
    if (state?.error) {
      toast.danger(state.error);
    }
  }, [state]);

  if (compact) {
    return (
      <form action={formAction}>
        <input name="weekStart" type="hidden" value={weekStart} />
        <input name="source" type="hidden" value={settings.source} />
        {settings.slots.map((slot) => (
          <input key={slot} name="slots" type="hidden" value={slot} />
        ))}
        <input name="mealsPerDay" type="hidden" value={settings.mealsPerDay} />
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

      <div className="grid items-start gap-5 md:grid-cols-[auto_12rem_minmax(24rem,1fr)] md:gap-8">
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

        <MealsPerDayField
          min={settings.slots.length}
          name="mealsPerDay"
          onChange={settings.setMealsPerDay}
          value={settings.mealsPerDay}
        />

        <MealTypeChoices
          name="slots"
          onChange={settings.setSlot}
          types={settings.slots}
        />
      </div>

      <Typography color="muted" type="body-sm">
        {settings.slots.length === 0
          ? "Choose at least one kind of meal."
          : `A day runs ${buildDay(settings.slots, settings.mealsPerDay)
              .map((_, index, shape) => mealLabel(shape, index))
              .join(", ")}.`}
      </Typography>

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
