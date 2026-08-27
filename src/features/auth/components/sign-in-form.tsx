"use client";

import { useActionState } from "react";
import { Button, Input, Label, TextField } from "@heroui/react";

import { signIn, type AuthFormState } from "../auth.actions";
import { FormMessage } from "./form-message";

export function SignInForm({ next }: { next?: string }) {
  const [state, formAction, isPending] = useActionState<
    AuthFormState,
    FormData
  >(signIn, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {next ? <input name="next" type="hidden" value={next} /> : null}

      {state.error ? (
        <FormMessage tone="error">{state.error}</FormMessage>
      ) : null}

      <TextField isRequired name="email" type="email">
        <Label>Email</Label>
        <Input autoComplete="email" placeholder="you@example.com" />
      </TextField>

      <TextField isRequired name="password" type="password">
        <Label>Password</Label>
        <Input autoComplete="current-password" />
      </TextField>

      <Button className="w-full" isPending={isPending} type="submit">
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
