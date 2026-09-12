"use client";

import { AlertDialog, Button } from "@heroui/react";

import { ControlledDialogTrigger } from "./controlled-dialog-trigger";
import { FormMessage } from "./form-message";

type ConfirmDialogProps = {
  cancelLabel?: string;
  confirmLabel: string;
  description: string;
  /** Why the confirmed action was refused, shown without closing the dialog. */
  error?: string | null;
  heading: string;
  isOpen: boolean;
  isPending?: boolean;
  onConfirm: () => void;
  onOpenChange: (isOpen: boolean) => void;
};

export function ConfirmDialog({
  cancelLabel = "Keep it",
  confirmLabel,
  description,
  error,
  heading,
  isOpen,
  isPending = false,
  onConfirm,
  onOpenChange,
}: ConfirmDialogProps) {
  return (
    <AlertDialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <ControlledDialogTrigger />
      <AlertDialog.Backdrop>
        <AlertDialog.Container placement="auto" size="md">
          <AlertDialog.Dialog className="sm:max-w-md">
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading>{heading}</AlertDialog.Heading>
            </AlertDialog.Header>

            <AlertDialog.Body className="flex flex-col gap-3">
              <p>{description}</p>
              {error ? <FormMessage tone="error">{error}</FormMessage> : null}
            </AlertDialog.Body>

            <AlertDialog.Footer>
              <Button slot="close" variant="tertiary">
                {cancelLabel}
              </Button>
              <Button
                isPending={isPending}
                onPress={onConfirm}
                variant="danger"
              >
                {confirmLabel}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
