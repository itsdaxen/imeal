"use client";

import { useActionState, useEffect, useState } from "react";
import { MailCheck } from "lucide-react";
import { Button, Input, Label, TextField } from "@heroui/react";

import { requestPasswordReset, type AuthFormState } from "../auth.actions";
import { FormMessage } from "./form-message";

const RESEND_SECONDS = 30;

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState<
    AuthFormState,
    FormData
  >(requestPasswordReset, {});

  if (state.sentTo) {
    return <SentPanel email={state.sentTo} />;
  }

  return (
    <form action={formAction} className="all-required flex flex-col gap-5">
      {state.error ? (
        <FormMessage tone="error">{state.error}</FormMessage>
      ) : null}

      <TextField isRequired name="email" type="email">
        <Label>Email</Label>
        <Input autoComplete="email" placeholder="you@example.com" />
      </TextField>

      <Button className="w-full" isPending={isPending} type="submit">
        {isPending ? "Sending…" : "Send a reset link"}
      </Button>
    </form>
  );
}

/**
 * Waiting for an email is the one moment this flow leaves the product, so the
 * screen has to say where the link went and what to do while it has not arrived.
 */
function SentPanel({ email }: { email: string }) {
  const [state, formAction, isPending] = useActionState<
    AuthFormState,
    FormData
  >(requestPasswordReset, {});
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (secondsLeft === 0) {
      return;
    }

    const timer = window.setTimeout(
      () => setSecondsLeft((seconds) => seconds - 1),
      1000,
    );

    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  return (
    <div className="flex flex-col gap-5">
      <span
        aria-hidden="true"
        className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent"
      >
        <MailCheck className="size-6" />
      </span>

      <div className="flex flex-col gap-2">
        <p className="text-lg font-semibold">Check your inbox</p>
        <p className="text-sm text-muted">
          If <span className="font-medium text-foreground">{email}</span> has an
          account, a reset link is on its way. It can take a couple of minutes,
          and it sometimes lands in spam.
        </p>
      </div>

      {state.notice ? (
        <FormMessage tone="notice">Sent again just now.</FormMessage>
      ) : null}

      <form
        action={formAction}
        className="all-required flex flex-col gap-3"
        onSubmit={() => setSecondsLeft(RESEND_SECONDS)}
      >
        <input name="email" type="hidden" value={email} />
        <Button
          className="w-full"
          isDisabled={secondsLeft > 0}
          isPending={isPending}
          type="submit"
          variant="tertiary"
        >
          {secondsLeft > 0
            ? `Resend in ${secondsLeft}s`
            : "Send the link again"}
        </Button>
      </form>
    </div>
  );
}
