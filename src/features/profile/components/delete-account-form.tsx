"use client";

import { useActionState } from "react";
import {
  Button,
  Card,
  Disclosure,
  Input,
  Label,
  TextField,
} from "@heroui/react";

import { ContentCard } from "@/components/ui/content-card";
import { PanelTitle } from "@/components/ui/panel-title";
import { FormMessage } from "@/components/ui/form-message";

import { deleteAccount, type DeleteAccountState } from "../profile.actions";

export function DeleteAccountForm() {
  const [state, formAction, isPending] = useActionState<
    DeleteAccountState,
    FormData
  >(deleteAccount, {});

  return (
    <ContentCard className="gap-0 border border-danger/25" density="flush">
      {/* Closing an account is rare and unrecoverable, so it stays findable without
          sitting open beside the settings people actually come here to change. */}
      <Disclosure>
        <Disclosure.Heading>
          <Disclosure.Trigger className="flex w-full items-center gap-4 p-5 text-left md:p-7">
            <span className="flex flex-col gap-1">
              <PanelTitle level={2}>Delete account</PanelTitle>
              <Card.Description>
                Permanently remove your profile and everything in it.
              </Card.Description>
            </span>
            <Disclosure.Indicator />
          </Disclosure.Trigger>
        </Disclosure.Heading>

        <Disclosure.Content>
          <Disclosure.Body className="flex flex-col gap-5 border-t border-danger/20 p-5 md:p-7">
            <Card.Description>
              This removes your recipes, plans, shopping lists, friendships, and
              uploaded photographs. Published catalog copies keep their recipe
              text without your photograph. It cannot be undone.
            </Card.Description>

            <form action={formAction} className="flex flex-col gap-4">
              {state.error ? (
                <FormMessage tone="error">{state.error}</FormMessage>
              ) : null}

              <TextField isRequired name="confirmation">
                <Label>Type DELETE to confirm</Label>
                <Input
                  autoComplete="off"
                  placeholder="DELETE"
                  spellCheck={false}
                />
              </TextField>

              <div className="flex justify-end">
                <Button isPending={isPending} type="submit" variant="danger">
                  {isPending
                    ? "Deleting account…"
                    : "Delete account permanently"}
                </Button>
              </div>
            </form>
          </Disclosure.Body>
        </Disclosure.Content>
      </Disclosure>
    </ContentCard>
  );
}
