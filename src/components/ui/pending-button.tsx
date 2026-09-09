"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button, cn, Spinner } from "@heroui/react";

/**
 * A button's contents while its write is in flight.
 *
 * The label is hidden rather than removed so the button keeps its width: a button
 * that shrinks to a spinner drags the row beside it along, and lands somewhere else
 * when it comes back. The spinner sits over the space the label left behind.
 */
export function BusyContent({
  busy,
  children,
}: {
  busy: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <span className={cn("flex items-center gap-2", busy && "invisible")}>
        {children}
      </span>

      {busy ? (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner aria-label="Working" size="sm" />
        </span>
      ) : null}
    </>
  );
}

/** A server-action submit that acknowledges the form's pending transition. */
export function PendingButton({
  children,
  className,
  isPending: controlledPending,
  ...props
}: Omit<ComponentPropsWithoutRef<typeof Button>, "children"> & {
  /** Plain nodes only: the busy spinner has to sit over them. */
  children?: ReactNode;
}) {
  const { pending } = useFormStatus();
  const busy = Boolean(controlledPending) || pending;

  return (
    <Button
      className={cn("relative", className)}
      isPending={busy}
      type="submit"
      {...props}
    >
      <BusyContent busy={busy}>{children}</BusyContent>
    </Button>
  );
}
