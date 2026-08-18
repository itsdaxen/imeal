"use client";

import { useActionState } from "react";
import { Button, Input, Label, TextField } from "@heroui/react";

import { requestPasswordReset, type AuthFormState } from "../auth.actions";
import { FormMessage } from "./form-message";

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState<
    AuthFormState,
    FormData
  >(requestPasswordReset, {});

  if (state.notice) {
    return <FormMessage tone="notice">{state.notice}</FormMessage>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error ? (
        <FormMessage tone="error">{state.error}</FormMessage>
      ) : null}

      <TextField isRequired name="email" type="email">
        <Label>Email</Label>
        <Input autoComplete="email" placeholder="you@example.com" />
      </TextField>

      <Button isPending={isPending} type="submit">
        {isPending ? "Sending…" : "Send a reset link"}
      </Button>
    </form>
  );
}
