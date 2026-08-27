"use client";

import { useActionState } from "react";
import { Button, Description, Input, Label, TextField } from "@heroui/react";

import { updatePassword, type AuthFormState } from "../auth.actions";
import { FormMessage } from "./form-message";

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState<
    AuthFormState,
    FormData
  >(updatePassword, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error ? (
        <FormMessage tone="error">{state.error}</FormMessage>
      ) : null}

      <TextField isRequired name="password" type="password">
        <Label>New password</Label>
        <Input autoComplete="new-password" />
        <Description>At least 8 characters.</Description>
      </TextField>

      <TextField isRequired name="confirmation" type="password">
        <Label>Confirm it</Label>
        <Input autoComplete="new-password" />
      </TextField>

      <Button className="w-full" isPending={isPending} type="submit">
        {isPending ? "Saving…" : "Set the new password"}
      </Button>
    </form>
  );
}
