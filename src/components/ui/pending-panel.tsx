"use client";

import type { ReactNode } from "react";

/**
 * Content that admits it is being replaced.
 *
 * The fade is the whole signal, deliberately. The control you pressed has already
 * moved — a tab marks itself selected before the server answers — so a spinner here
 * would be a second announcement of the same event, landing in the middle of the panel
 * rather than under the hand that caused it. On a swap this quick it mostly flashes
 * in and out, which reads as jitter rather than progress.
 *
 * The panel keeps its place rather than collapsing, so nothing below it moves, and
 * `aria-busy` carries the same news to a screen reader, which cannot see the fade.
 */
export function PendingPanel({
  children,
  isPending,
}: {
  children: ReactNode;
  isPending: boolean;
}) {
  return (
    <div
      aria-busy={isPending}
      className={
        isPending
          ? "pointer-events-none opacity-40 transition-opacity duration-150 motion-reduce:transition-none"
          : "transition-opacity duration-150 motion-reduce:transition-none"
      }
    >
      {children}
    </div>
  );
}
