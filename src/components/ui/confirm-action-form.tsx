"use client";

import { useRef, useState } from "react";
import { ActionButton } from "./action";
import { ConfirmDialog } from "./confirm-dialog";

type ConfirmActionFormProps = {
  action: (formData: FormData) => Promise<void>;
  confirmLabel: string;
  description: string;
  fields: Record<string, string>;
  heading: string;
  label: string;
};

/**
 * A form whose submit is gated on a confirmation, for actions that cannot be undone.
 */
export function ConfirmActionForm({
  action,
  confirmLabel,
  description,
  fields,
  heading,
  label,
}: ConfirmActionFormProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <form action={action} ref={formRef}>
        {Object.entries(fields).map(([name, value]) => (
          <input key={name} name={name} type="hidden" value={value} />
        ))}

        {/* Everything routed through a confirmation is irreversible, so the
            trigger carries the danger tier rather than looking like navigation. */}
        <ActionButton
          onPress={() => setIsConfirming(true)}
          tier="danger"
          type="button"
        >
          {label}
        </ActionButton>
      </form>

      <ConfirmDialog
        confirmLabel={confirmLabel}
        description={description}
        heading={heading}
        isOpen={isConfirming}
        onConfirm={() => {
          setIsConfirming(false);
          // The dialog renders in a portal, so submit the form directly.
          formRef.current?.requestSubmit();
        }}
        onOpenChange={setIsConfirming}
      />
    </>
  );
}
