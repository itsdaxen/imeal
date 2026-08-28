"use client";

import { useActionState } from "react";
import { Button, Card, Input, Label, TextField } from "@heroui/react";

import { ContentCard } from "@/components/ui/content-card";
import { PanelTitle } from "@/components/ui/panel-title";
import { FormMessage } from "@/features/auth/components/form-message";

import { deleteAccount, type DeleteAccountState } from "../profile.actions";

export function DeleteAccountForm() {
  const [state, formAction, isPending] = useActionState<
    DeleteAccountState,
    FormData
  >(deleteAccount, {});

  return (
    <ContentCard className="gap-5 border-danger/30" density="spacious">
      <Card.Header className="flex-col items-start gap-1 p-0">
        <PanelTitle level={2}>Delete account</PanelTitle>
        <Card.Description>
          Permanently remove your profile, recipes, plans, shopping lists,
          friendships, and uploaded photographs. Published catalog copies keep
          their recipe text without your photograph.
        </Card.Description>
      </Card.Header>

      <form action={formAction} className="flex flex-col gap-4">
        {state.error ? (
          <FormMessage tone="error">{state.error}</FormMessage>
        ) : null}

        <TextField isRequired name="confirmation">
          <Label>Type DELETE to confirm</Label>
          <Input autoComplete="off" placeholder="DELETE" spellCheck={false} />
        </TextField>

        <div className="flex justify-end">
          <Button isPending={isPending} type="submit" variant="danger">
            {isPending ? "Deleting account…" : "Delete account permanently"}
          </Button>
        </div>
      </form>
    </ContentCard>
  );
}
