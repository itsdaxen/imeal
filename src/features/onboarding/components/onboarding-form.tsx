"use client";

import type { ReactNode } from "react";
import { useActionState, useRef, useState } from "react";
import {
  Button,
  Description,
  Input,
  Label,
  Link,
  TextArea,
  TextField,
  Typography,
} from "@heroui/react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { ActionButton } from "@/components/ui/action";
import { ContentCard } from "@/components/ui/content-card";
import { FormMessage } from "@/components/ui/form-message";
import { LegalLinks } from "@/components/ui/legal-links";
import {
  MealsPerDayField,
  MealTypeChoices,
} from "@/features/profile/components/planning-default-fields";
import {
  buildDay,
  MAX_MEALS_PER_DAY,
  mealLabel,
} from "@/features/planner/day-shape";
import { MEAL_SLOTS, type MealSlot } from "@/features/recipes/recipe.schema";

import {
  completeOnboarding,
  type OnboardingState,
} from "../onboarding.actions";

const STEP_COUNT = 4;

export function OnboardingForm({
  day,
  displayName,
}: {
  day: MealSlot[];
  displayName: string;
}) {
  const initialTypes = MEAL_SLOTS.filter((slot) => day.includes(slot));
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(1);
  const [name, setName] = useState(displayName);
  const [types, setTypes] = useState<MealSlot[]>(
    initialTypes.length > 0 ? initialTypes : [...MEAL_SLOTS],
  );
  const [mealsPerDay, setMealsPerDay] = useState(
    day.length || MEAL_SLOTS.length,
  );
  const [staples, setStaples] = useState("");
  const [state, formAction, isPending] = useActionState<
    OnboardingState,
    FormData
  >(completeOnboarding, {});
  const shapedDay = buildDay(types, mealsPerDay);
  const canContinue =
    (step === 1 && name.trim().length > 0) ||
    (step === 2 && types.length > 0) ||
    (step === 3 &&
      mealsPerDay >= types.length &&
      mealsPerDay <= MAX_MEALS_PER_DAY) ||
    step === 4;

  function toggleType(slot: MealSlot, checked: boolean) {
    const next = MEAL_SLOTS.filter((entry) =>
      entry === slot ? checked : types.includes(entry),
    );
    setTypes(next);
    setMealsPerDay((current) => Math.max(current, next.length));
  }

  function continueOnboarding() {
    if (!canContinue) return;
    if (step < STEP_COUNT) {
      setStep((current) => current + 1);
      return;
    }
    formRef.current?.requestSubmit();
  }

  return (
    <ContentCard
      className="mx-auto min-h-[calc(100svh-2.5rem)] w-full max-w-5xl gap-0 sm:min-h-[calc(100svh-4rem)]"
      density="flush"
    >
      <header className="flex items-center justify-between gap-4 p-6 sm:p-8">
        <Link
          aria-label="iMeal home"
          className="font-brand text-2xl leading-normal text-foreground no-underline"
          href="/"
        >
          iMeal
        </Link>
        <div
          aria-label={`Step ${step} of ${STEP_COUNT}`}
          className="flex items-center gap-2"
        >
          {Array.from({ length: STEP_COUNT }, (_, index) => index + 1).map(
            (number) => (
              <span
                aria-hidden="true"
                className={`h-1.5 rounded-full transition-all ${
                  number === step
                    ? "w-8 bg-accent"
                    : number < step
                      ? "w-4 bg-accent/40"
                      : "w-4 bg-default"
                }`}
                key={number}
              />
            ),
          )}
        </div>
        <span className="text-sm text-muted">
          {step} of {STEP_COUNT}
        </span>
      </header>

      <form action={formAction} className="flex flex-1 flex-col" ref={formRef}>
        <input name="displayName" type="hidden" value={name} />
        <input name="defaultMealsPerDay" type="hidden" value={mealsPerDay} />
        {types.map((type) => (
          <input
            key={type}
            name="defaultMealTypes"
            type="hidden"
            value={type}
          />
        ))}
        <input name="staples" type="hidden" value={staples} />
        <input name="discoverable" type="hidden" value="on" />

        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-10 sm:px-10 sm:py-14">
          {state.error ? (
            <FormMessage className="mb-6" tone="error">
              {state.error}
            </FormMessage>
          ) : null}

          {step === 1 ? (
            <>
              <StepHeading
                eyebrow="Make it yours"
                title="What should iMeal call you?"
              >
                Your name appears on shared recipes, plans, and shopping lists.
              </StepHeading>
              <TextField className="mt-8 max-w-xl" isRequired>
                <Label>Your name</Label>
                <Input
                  autoComplete="name"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  value={name}
                />
              </TextField>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <StepHeading
                eyebrow="Shape your day"
                title="Which meals do you usually plan?"
              >
                Choose every kind that normally belongs in your day. You can
                still change any individual day in the planner.
              </StepHeading>
              <div className="mt-8">
                <MealTypeChoices
                  name="mealTypePreview"
                  onChange={toggleType}
                  types={types}
                />
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <StepHeading
                eyebrow="Set the pace"
                title="How many meals do you plan each day?"
              >
                We’ll repeat lunch or dinner when your number is larger than the
                meal types you chose.
              </StepHeading>
              <div className="mt-8 max-w-xs">
                <MealsPerDayField
                  min={types.length}
                  name="mealsPerDayPreview"
                  onChange={(value) =>
                    setMealsPerDay(
                      Number.isFinite(value) ? value : types.length,
                    )
                  }
                  value={mealsPerDay}
                />
              </div>
              <Typography className="mt-4" color="muted" type="body-sm">
                {shapedDay.length > 0
                  ? `Your usual day: ${shapedDay.map((_, index) => mealLabel(shapedDay, index)).join(", ")}.`
                  : "Choose at least one meal type first."}
              </Typography>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <StepHeading
                eyebrow="Optional"
                title="What do you buy most weeks?"
              >
                Add pantry and fridge staples once. Later, you can send them to
                any shopping list from its menu.
              </StepHeading>
              <TextField className="mt-8 max-w-xl">
                <Label>Your staples</Label>
                <TextArea
                  onChange={(event) => setStaples(event.target.value)}
                  placeholder={"Milk\nOlive oil\nCoffee"}
                  rows={5}
                  value={staples}
                />
                <Description>
                  One per line or separated with commas. Leave blank to skip.
                </Description>
              </TextField>
            </>
          ) : null}
        </main>

        <footer className="flex items-center justify-between gap-4 border-t border-separator p-6 sm:p-8">
          <Button
            isDisabled={step === 1 || isPending}
            onPress={() => setStep((current) => Math.max(1, current - 1))}
            variant="ghost"
          >
            <ArrowLeft aria-hidden="true" />
            Back
          </Button>
          {step === STEP_COUNT ? (
            <ActionButton
              isPending={isPending}
              onPress={continueOnboarding}
              tier="primary"
              type="button"
            >
              {isPending
                ? "Setting up…"
                : staples.trim()
                  ? "Start planning"
                  : "Skip for now"}
              <ArrowRight aria-hidden="true" />
            </ActionButton>
          ) : (
            <Button isDisabled={!canContinue} onPress={continueOnboarding}>
              Continue
              <ArrowRight aria-hidden="true" />
            </Button>
          )}
        </footer>
      </form>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-6 pb-6 text-xs text-muted sm:px-8 sm:pb-8">
        <span>© {new Date().getFullYear()} iMeal</span>
        <LegalLinks />
      </div>
    </ContentCard>
  );
}

function StepHeading({
  children,
  eyebrow,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <div>
      <Typography
        className="tracking-widest text-accent uppercase"
        type="body-xs"
        weight="semibold"
      >
        {eyebrow}
      </Typography>
      <Typography
        className="mt-3 text-4xl tracking-tight sm:text-5xl"
        type="h1"
      >
        {title}
      </Typography>
      <Typography
        className="mt-4 max-w-2xl text-lg leading-7"
        color="muted"
        type="body"
      >
        {children}
      </Typography>
    </div>
  );
}
