"use client";

import { useActionState, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button, Typography } from "@heroui/react";

import { FormMessage } from "@/features/auth/components/form-message";

import { applyTidy, proposeTidy, type TidyState } from "../ai.actions";
import type { TidyChange } from "../tidy-list";
import { AppDialog } from "@/components/ui/app-dialog";

type TidyPanelProps = {
  items: ReadonlyArray<{ id: string; name: string; category: string | null }>;
  listId: string;
};

function describe(
  change: TidyChange,
  before: Map<string, { name: string; category: string | null }>,
) {
  const original = before.get(change.id);
  const notes: string[] = [];

  if (change.mergedIds.length > 0) {
    notes.push(`${change.mergedIds.length + 1} rows into one`);
  }

  if (original && original.name !== change.name) {
    notes.push(`renamed from “${original.name}”`);
  }

  if (original?.category !== change.category) {
    notes.push(`filed under ${change.category}`);
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
  const proposed = (state.changes ?? [])
    .map((change) => ({ change, notes: describe(change, before) }))
    .filter(({ notes }) => notes.length > 0);

  const answered = state.changes !== undefined || state.error !== undefined;

  return (
    <>
      <form action={formAction}>
        <input name="listId" type="hidden" value={listId} />
        <Button
          className="min-h-11"
          isPending={isPending}
          type="submit"
          variant="tertiary"
        >
          <Sparkles aria-hidden="true" className="size-4" />
          Tidy list
        </Button>
      </form>

      {/* The proposal is a decision, so it interrupts rather than appending below. */}
      <AppDialog
        bodyClassName="flex flex-col gap-4"
        heading="Tidy up"
        isOpen={answered && !dismissed}
        onOpenChange={() => setDismissed(true)}
        width="lg"
      >
        {state.error ? (
          <FormMessage tone="error">{state.error}</FormMessage>
        ) : null}

        {state.changes && proposed.length === 0 ? (
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
                <li className="flex flex-col" key={change.id}>
                  <Typography type="body-sm">
                    {change.name}
                    {change.quantity > 1 ? ` × ${change.quantity}` : ""}
                  </Typography>
                  <Typography color="muted" type="body-xs">
                    {notes.join(" · ")}
                  </Typography>
                </li>
              ))}
            </ul>

            <form action={applyTidy}>
              <input name="listId" type="hidden" value={listId} />
              <Button type="submit">Apply these changes</Button>
            </form>
          </>
        ) : null}
      </AppDialog>
    </>
  );
}
