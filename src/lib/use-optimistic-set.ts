"use client";

import { useOptimistic } from "react";

/**
 * A set of ids that flips the moment you press, not when the server answers.
 *
 * Sharing a recipe and sharing a week both show a button that reads "Share" or "Stop
 * sharing", and a label that waits for a round trip reads as a control that ignored
 * you. Both had written this reducer out, and both had to remember the part that is
 * easy to get wrong: the Set must be copied before it is changed, because React
 * compares by identity and a mutated Set is the same Set — the screen simply would
 * not update.
 */
export function useOptimisticSet(ids: string[]) {
  return useOptimistic(new Set(ids), (current, id: string) => {
    const next = new Set(current);

    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }

    return next;
  });
}
