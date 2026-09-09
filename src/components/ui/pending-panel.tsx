"use client";

import type { ReactNode } from "react";
import { Spinner } from "@heroui/react";

/**
 * Content that admits it is being replaced.
 *
 * The panel keeps its place and fades rather than collapsing, so the page does not
 * jump to a spinner's height and back — which also means the spinner can sit in the
 * middle of the space the content still occupies. `aria-busy` carries the same news
 * to a screen reader, which cannot see the fade.
 */
export function PendingPanel({
  children,
  isPending,
}: {
  children: ReactNode;
  isPending: boolean;
}) {
  return (
    <div aria-busy={isPending} className="relative">
      <div
        className={
          isPending
            ? "pointer-events-none opacity-40 transition-opacity duration-150 motion-reduce:transition-none"
            : "transition-opacity duration-150 motion-reduce:transition-none"
        }
      >
        {children}
      </div>

      {isPending ? (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner aria-label="Loading" />
        </span>
      ) : null}
    </div>
  );
}
