"use client";

import { useState } from "react";
import { Button, Typography } from "@heroui/react";

import { useWakeLock } from "../use-wake-lock";

type CookingSessionProps = {
  ingredients: string[];
  steps: string[];
};

export function CookingSession({ ingredients, steps }: CookingSessionProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [gathered, setGathered] = useState<ReadonlySet<number>>(new Set());

  useWakeLock(true);

  const toggleIngredient = (index: number) => {
    setGathered((current) => {
      const next = new Set(current);

      if (!next.delete(index)) {
        next.add(index);
      }

      return next;
    });
  };

  const isLastStep = stepIndex === steps.length - 1;

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <Typography type="h2" weight="semibold">
          Ingredients
        </Typography>

        <ul className="flex list-none flex-col gap-1 p-0">
          {ingredients.map((ingredient, index) => {
            const isGathered = gathered.has(index);

            return (
              <li key={`${index}-${ingredient}`}>
                <button
                  aria-pressed={isGathered}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left text-lg"
                  onClick={() => toggleIngredient(index)}
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-6 shrink-0 place-items-center rounded-md border border-border"
                  >
                    {isGathered ? "✓" : ""}
                  </span>
                  <span
                    className={
                      isGathered ? "text-muted line-through" : undefined
                    }
                  >
                    {ingredient}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <Typography type="h2" weight="semibold">
            Step {stepIndex + 1}
          </Typography>
          <Typography className="text-muted" type="body-sm">
            of {steps.length}
          </Typography>
        </div>

        <p aria-live="polite" className="text-xl leading-relaxed text-balance">
          {steps[stepIndex]}
        </p>

        <div className="flex gap-3">
          <Button
            isDisabled={stepIndex === 0}
            onPress={() => setStepIndex((index) => index - 1)}
            variant="tertiary"
          >
            Back
          </Button>
          <Button
            isDisabled={isLastStep}
            onPress={() => setStepIndex((index) => index + 1)}
          >
            {isLastStep ? "Finished" : "Next"}
          </Button>
        </div>
      </section>
    </div>
  );
}
