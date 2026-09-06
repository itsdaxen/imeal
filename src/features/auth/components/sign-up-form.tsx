"use client";

import { useActionState } from "react";
import { Button, Description, Input, Label, TextField } from "@heroui/react";

import { signUp, type AuthFormState } from "../auth.actions";
import { FormMessage } from "@/components/ui/form-message";

export function SignUpForm() {
  const [state, formAction, isPending] = useActionState<
    AuthFormState,
    FormData
  >(signUp, {});

  if (state.notice) {
    return <FormMessage tone="notice">{state.notice}</FormMessage>;
  }

  return (
    <form action={formAction} className="all-required flex flex-col gap-5">
      {state.error ? (
        <FormMessage tone="error">{state.error}</FormMessage>
      ) : null}

      <TextField name="displayName">
        <Label>Display name</Label>
        <Input autoComplete="name" placeholder="Optional" />
      </TextField>

      <TextField isRequired name="email" type="email">
        <Label>Email</Label>
        <Input autoComplete="email" placeholder="you@example.com" />
      </TextField>

      <TextField isRequired name="password" type="password">
        <Label>Password</Label>
        <Input autoComplete="new-password" />
        <Description>At least 8 characters.</Description>
      </TextField>

      <Button className="w-full" isPending={isPending} type="submit">
        {isPending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
