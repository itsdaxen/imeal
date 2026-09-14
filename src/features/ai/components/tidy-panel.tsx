"use client";

import { useActionState, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button, Typography } from "@heroui/react";

import { FormMessage } from "@/components/ui/form-message";

import { applyTidy, proposeTidy, type TidyState } from "../ai.actions";
import { countChanges, type OrganizedItem } from "../tidy-list";
import { AppDialog, closing } from "@/components/ui/app-dialog";
import { PendingButton } from "@/components/ui/pending-button";

type TidyPanelProps = {
  items: ReadonlyArray<{
    id: string;
    name: string;
    quantity: number;
    unit: string | null;
    checked: boolean;
    category: string | null;
  }>;
  listId: string;
};

type Progress = "idle" | "sending" | "organizing" | "done" | "error";

const PROGRESS_LABEL: Record<Progress, string> = {
  idle: "Organize list",
  sending: "Sending to AI",
  organizing: "AI is organizing",
  done: "List organized",
  error: "Try organizing again",
};

/**
 * The wait, spelled out beside the label.
 *
 * An ellipsis says the same thing and says it motionless, which on a wait of twenty
 * seconds to a minute reads as a button that has stopped rather than one that is
 * working.
 */
function WorkingDots() {
  return (
    <span aria-hidden="true" className="inline-flex items-end gap-0.5 pb-0.5">
      {[0, 1, 2].map((dot) => (
        <span
          className="size-1 [animation:tidy-dot_1.4s_ease-in-out_infinite] rounded-full bg-current motion-reduce:animate-none"
          key={dot}
          style={{ animationDelay: `${dot * 180}ms` }}
        />
      ))}
    </span>
  );
}

function describe(
  change: OrganizedItem,
  before: Map<
    string,
    {
      name: string;
      quantity: number;
      unit: string | null;
      category: string | null;
    }
  >,
) {
  const original = before.get(change.sourceIds[0]);
  const notes: string[] = [];

  if (change.sourceIds.length > 1) {
    notes.push(`${change.sourceIds.length} items combined`);
  }

  if (original && original.name !== change.name) {
    notes.push(`renamed from “${original.name}”`);
  }

  if (original?.category !== change.category) {
    notes.push(`moved to ${change.category}`);
  }

  if (
    original &&
    (original.quantity !== change.quantity || original.unit !== change.unit)
  ) {
    notes.push("quantity converted");
  }

  return notes;
}

export function TidyPanel({ items, listId }: TidyPanelProps) {
  const [state, formAction, isPending] = useActionState<TidyState, FormData>(
    proposeTidy,
    {},
  );
  const [dismissed, setDismissed] = useState(false);
  const [pendingProgress, setPendingProgress] = useState<Progress>("sending");

  useEffect(() => {
    if (!isPending) return;

    const organizing = window.setTimeout(
      () => setPendingProgress("organizing"),
      500,
    );

    return () => window.clearTimeout(organizing);
  }, [isPending]);

  const progress: Progress = isPending
    ? pendingProgress
    : state.proposal
      ? "done"
      : state.error
        ? "error"
        : "idle";

  const before = new Map(items.map((item) => [item.id, item]));
  const proposed = (state.proposal?.items ?? [])
    .map((change) => ({ change, notes: describe(change, before) }))
    .filter(({ notes }) => notes.length > 0);

  const answered = state.proposal !== undefined || state.error !== undefined;

  return (
    <>
      <form
        action={formAction}
        onSubmit={() => {
          setDismissed(false);
          setPendingProgress("sending");
        }}
      >
        <input name="listId" type="hidden" value={listId} />
        <Button
          className="min-h-11 min-w-48"
          isPending={isPending}
          type="submit"
          variant="tertiary"
        >
          <Sparkles aria-hidden="true" className="size-4" />
          <span
            aria-live="polite"
            className="inline-flex [animation:tidy-status-in_180ms_ease-out] items-center gap-1 motion-reduce:animate-none"
            key={progress}
          >
            {PROGRESS_LABEL[progress]}
            {isPending ? <WorkingDots /> : null}
          </span>
        </Button>
      </form>

      {/* The proposal is a decision, so it interrupts rather than appending below. */}
      <AppDialog
        bodyClassName="flex flex-col gap-4"
        heading="Organize list"
        isOpen={answered && !dismissed}
        onOpenChange={() => setDismissed(true)}
        width="lg"
      >
        {state.error ? (
          <FormMessage tone="error">{state.error}</FormMessage>
        ) : null}

        {state.proposal && countChanges(items, state.proposal) === 0 ? (
          <Typography color="muted" type="body-sm">
            The list is already tidy. Nothing to change.
          </Typography>
        ) : null}

        {proposed.length > 0 ? (
          <>
            <Typography type="body-sm" weight="medium">
              {proposed.length} {proposed.length === 1 ? "change" : "changes"}{" "}
              proposed
            </Typography>

            <ul className="flex list-none flex-col gap-2 p-0">
              {proposed.map(({ change, notes }) => (
                <li className="flex flex-col" key={change.sourceIds.join(":")}>
                  <Typography type="body-sm">
                    {change.name}
                    {` · ${change.quantity}${change.unit ? ` ${change.unit}` : ""}`}
                  </Typography>
                  <Typography color="muted" type="body-xs">
                    {[...notes, change.explanation].join(" · ")}
                  </Typography>
                </li>
              ))}
            </ul>

            <form action={closing(applyTidy, () => setDismissed(true))}>
              <input name="listId" type="hidden" value={listId} />
              <input name="revision" type="hidden" value={state.revision} />
              <input
                name="proposal"
                type="hidden"
                value={JSON.stringify(state.proposal)}
              />
              <PendingButton>Apply these changes</PendingButton>
            </form>
          </>
        ) : null}
      </AppDialog>
    </>
  );
}
