"use client";

import type { ComponentPropsWithoutRef } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@heroui/react";

/** A server-action submit that acknowledges the form's pending transition. */
export function PendingButton({
  isPending: controlledPending,
  ...props
}: ComponentPropsWithoutRef<typeof Button>) {
  const { pending } = useFormStatus();

  return (
    <Button isPending={controlledPending || pending} type="submit" {...props} />
  );
}
