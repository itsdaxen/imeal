"use client";

import type { ReactNode } from "react";
import { Modal } from "@heroui/react";

import { ControlledDialogTrigger } from "./controlled-dialog-trigger";

/**
 * A form action that also dismisses the dialog it was submitted from.
 *
 * A dialog is a question; once you answer it, it should get out of the way. Several
 * stayed open over the page they had just changed, which reads as a submit that did
 * not work — you press Save, the list renames behind the dialog, and the dialog sits
 * there inviting you to press Save again.
 *
 * The dialog closes as soon as the action is dispatched rather than when it finishes,
 * for the same reason the rest of the app updates optimistically: a control that waits
 * for a round trip before acknowledging you looks broken. The pending promise is still
 * returned so React owns it — dropping it would turn a failed write into an unhandled
 * rejection instead of something the error boundary can show.
 */
export function closing(
  action: (data: FormData) => void | Promise<void>,
  close: () => void,
) {
  return (data: FormData) => {
    const finished = action(data);
    close();

    return finished;
  };
}

const widths = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
} as const;

/**
 * A modal, with the parts that are the same everywhere already decided.
 *
 * Nine dialogs were each spelling out the same three-deep backdrop-container-dialog
 * nesting, so "every dialog blurs what is behind it" was a habit nine places had to
 * keep rather than something the code guaranteed. Only the heading, the width and the
 * contents ever differed, so those are the props and the rest lives here.
 */
export function AppDialog({
  bodyClassName,
  children,
  heading,
  isOpen,
  onOpenChange,
  width = "md",
}: {
  /** Layout for the body's own children; the dialog chrome around it never varies. */
  bodyClassName?: string;
  children: ReactNode;
  heading: ReactNode;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  width?: keyof typeof widths;
}) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ControlledDialogTrigger />
      <Modal.Backdrop variant="blur">
        <Modal.Container>
          <Modal.Dialog className={widths[width]}>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{heading}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className={bodyClassName}>{children}</Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
