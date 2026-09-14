"use client";

import { useActionState, useState } from "react";
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
  const before = new Map(items.map((item) => [item.id, item]));
  const proposed = (state.proposal?.items ?? [])
    .map((change) => ({ change, notes: describe(change, before) }))
    .filter(({ notes }) => notes.length > 0);

  const answered = state.proposal !== undefined || state.error !== undefined;

  return (
    <>
      <form action={formAction} className="flex flex-wrap items-center gap-3">
        <input name="listId" type="hidden" value={listId} />
        <Button
          className="min-h-11"
          isPending={isPending}
          type="submit"
          variant="tertiary"
        >
          <Sparkles aria-hidden="true" className="size-4" />
          Organize list
        </Button>
        {/* Reading a full list takes between twenty seconds and a minute, measured.
            A button that spins for that long with nothing said looks broken. */}
        {isPending ? (
          <Typography aria-live="polite" color="muted" type="body-sm">
            Reading your list. This can take a minute.
          </Typography>
        ) : null}
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
