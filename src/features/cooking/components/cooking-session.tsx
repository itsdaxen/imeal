"use client";

import { useEffect, useRef, useState } from "react";
import { Clock3, Lightbulb } from "lucide-react";
import { Button, Card, Typography } from "@heroui/react";

import { ContentCard } from "@/components/ui/content-card";

import { useWakeLock } from "../use-wake-lock";

type CookingSessionProps = {
  ingredients: string[];
  steps: string[];
  tip?: string | null;
};

function formatElapsed(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const clock = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  return hours > 0 ? `${hours}:${clock}` : clock;
}

export function CookingSession({
  ingredients,
  steps,
  tip,
}: CookingSessionProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [gathered, setGathered] = useState<ReadonlySet<number>>(new Set());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const elapsedAtStart = useRef(0);

  useWakeLock(true);

  useEffect(() => {
    if (startedAt === null) {
      return;
    }

    const updateElapsed = () => {
      setElapsedSeconds(
        elapsedAtStart.current +
          Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
      );
    };
    const interval = window.setInterval(updateElapsed, 1000);

    return () => window.clearInterval(interval);
  }, [startedAt]);

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
  const isRunning = startedAt !== null;
  const completed = Math.round(((stepIndex + 1) / steps.length) * 100);

  const toggleTimer = () => {
    if (startedAt === null) {
      elapsedAtStart.current = elapsedSeconds;
      setStartedAt(Date.now());
      return;
    }

    const nextElapsed =
      elapsedAtStart.current +
      Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    elapsedAtStart.current = nextElapsed;
    setElapsedSeconds(nextElapsed);
    setStartedAt(null);
  };

  const resetTimer = () => {
    elapsedAtStart.current = 0;
    setElapsedSeconds(0);
    setStartedAt(null);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
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
                    className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 py-3 text-left text-lg transition-colors hover:bg-default motion-reduce:transition-none"
                    onClick={() => toggleIngredient(index)}
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      className={`grid size-6 shrink-0 place-items-center rounded-md border transition-colors ${
                        isGathered
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border"
                      }`}
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

        <section className="flex flex-col gap-5">
          <div className="flex items-baseline justify-between gap-4">
            <Typography type="h2" weight="semibold">
              Step {stepIndex + 1}
            </Typography>
            <Typography className="text-muted" type="body-sm">
              of {steps.length}
            </Typography>
          </div>

          <p
            aria-live="polite"
            className="min-h-24 text-xl leading-relaxed text-balance sm:text-2xl"
            data-testid="current-step"
          >
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

      <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
        <ContentCard density="compact">
          <Card.Header className="flex-row items-center gap-2">
            <Clock3 aria-hidden="true" className="size-4 text-accent" />
            <Typography type="h2" weight="semibold">
              Elapsed time
            </Typography>
          </Card.Header>
          <Card.Content className="gap-4">
            <time
              aria-live="off"
              className="font-mono text-4xl font-semibold tracking-tight tabular-nums"
            >
              {formatElapsed(elapsedSeconds)}
            </time>
            <div className="flex gap-2">
              <Button onPress={toggleTimer} size="sm" variant="tertiary">
                {isRunning ? "Pause" : elapsedSeconds > 0 ? "Resume" : "Start"}
              </Button>
              <Button
                isDisabled={elapsedSeconds === 0 && !isRunning}
                onPress={resetTimer}
                size="sm"
                variant="ghost"
              >
                Reset
              </Button>
            </div>
          </Card.Content>
        </ContentCard>

        <ContentCard density="compact">
          <Card.Header className="flex-row items-baseline justify-between gap-3">
            <Typography type="h2" weight="semibold">
              Steps
            </Typography>
            <Typography className="text-muted" type="body-xs">
              {completed}%
            </Typography>
          </Card.Header>
          <Card.Content>
            <div
              aria-label={`${completed}% through the recipe`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={completed}
              className="h-1.5 overflow-hidden rounded-full bg-default"
              role="progressbar"
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] motion-reduce:transition-none"
                style={{ width: `${completed}%` }}
              />
            </div>

            <ol className="mt-3 flex list-none flex-col gap-1 p-0">
              {steps.map((step, index) => (
                <li key={`${index}-${step}`}>
                  <button
                    aria-label={`Go to step ${index + 1}: ${step}`}
                    aria-current={index === stepIndex ? "step" : undefined}
                    className={`flex min-h-11 w-full items-start gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors motion-reduce:transition-none ${
                      index === stepIndex
                        ? "bg-foreground text-background"
                        : "hover:bg-default"
                    }`}
                    onClick={() => setStepIndex(index)}
                    type="button"
                  >
                    <span className="font-semibold tabular-nums">
                      {index + 1}
                    </span>
                    <span className="line-clamp-2">{step}</span>
                  </button>
                </li>
              ))}
            </ol>
          </Card.Content>
        </ContentCard>

        {tip ? (
          <ContentCard density="compact">
            <Card.Header className="flex-row items-center gap-2">
              <Lightbulb aria-hidden="true" className="size-4 text-accent" />
              <Typography type="h2" weight="semibold">
                Tip
              </Typography>
            </Card.Header>
            <Card.Content>
              <Typography className="text-muted" type="body-sm">
                {tip}
              </Typography>
            </Card.Content>
          </ContentCard>
        ) : null}
      </aside>
    </div>
  );
}
