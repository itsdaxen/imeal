"use client";

import type { ReactNode } from "react";
import { Modal } from "@heroui/react";

import { ControlledDialogTrigger } from "./controlled-dialog-trigger";

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
