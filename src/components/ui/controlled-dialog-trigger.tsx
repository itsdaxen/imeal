import { Button } from "@heroui/react";

/** Satisfies React Aria's trigger contract when another control owns open state. */
export function ControlledDialogTrigger() {
  return <Button aria-hidden="true" className="hidden" isDisabled />;
}
