"use client";

import { useTransition } from "react";

export type ServerAction = (data: FormData) => Promise<void>;

/** Server actions take FormData whether or not a form was involved. */
function formDataOf(fields: Record<string, string>): FormData {
  const data = new FormData();
  Object.entries(fields).forEach(([name, value]) => data.set(name, value));

  return data;
}

/**
 * Running a server action from a control that is not a form.
 *
 * Ten components had written out the same three steps — build a FormData, open a
 * transition, call the action — and two of them had grown byte-identical `run`
 * helpers. Sharing it also hands every caller `isPending` for free, which is the part
 * that kept being forgotten: an action with no pending state is an action that looks
 * broken while it works.
 *
 * `optimistically` runs inside the transition, because that is the only place React
 * accepts an optimistic update.
 */
export function useServerAction() {
  const [isPending, startTransition] = useTransition();

  function run(
    action: ServerAction,
    fields: Record<string, string>,
    optimistically?: () => void,
  ) {
    startTransition(async () => {
      optimistically?.();
      await action(formDataOf(fields));
    });
  }

  return { isPending, run };
}
