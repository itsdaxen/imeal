"use client";

import { useActionState, useState } from "react";
import { Button, Card, Input, Label, TextField } from "@heroui/react";

import { FormMessage } from "@/components/ui/form-message";
import { ContentCard } from "@/components/ui/content-card";
import { ImagePicker } from "@/components/ui/image-picker";
import { PanelTitle } from "@/components/ui/panel-title";
import { IMAGE_TYPES } from "@/features/images/image";

import { updateProfile, type ProfileFormState } from "../profile.actions";
import type { Profile } from "../profile.queries";
import { PlanningDefaults } from "./planning-defaults";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [isDirty, setIsDirty] = useState(false);
  const [state, formAction, isPending] = useActionState<
    ProfileFormState,
    FormData
  >(updateProfile, {});
  // Adjusting during render rather than in an effect: a save that lands is not an
  // event to react to, it is a new state the form is already rendering for.
  const [seenSave, setSeenSave] = useState(state.savedAt);

  if (state.savedAt !== seenSave) {
    setSeenSave(state.savedAt);
    setIsDirty(false);
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-6"
      onChange={() => setIsDirty(true)}
    >
      {state.error ? (
        <FormMessage tone="error">{state.error}</FormMessage>
      ) : null}
      {state.savedAt ? (
        <FormMessage tone="notice">Profile saved.</FormMessage>
      ) : null}

      <ContentCard className="gap-5" density="spacious">
        <Card.Header className="flex-col items-start gap-1 p-0">
          <PanelTitle level={2}>Your identity</PanelTitle>
        </Card.Header>

        <ImagePicker
          accept={IMAGE_TYPES.join(",")}
          currentUrl={profile.avatarUrl}
          help="JPEG, PNG, WebP or AVIF · 2MB max"
          label="Profile photograph"
          name="avatar"
          onChange={() => setIsDirty(true)}
          shape="avatar"
        />

        <TextField
          defaultValue={profile.displayName}
          isRequired
          name="displayName"
        >
          <Label>Display name</Label>
          <Input placeholder="How friends will see you" />
        </TextField>
      </ContentCard>

      <ContentCard className="gap-5" density="spacious">
        <Card.Header className="flex-col items-start gap-1 p-0">
          <PanelTitle level={2}>Planning defaults</PanelTitle>
        </Card.Header>

        <PlanningDefaults day={profile.defaultDay} />
      </ContentCard>

      <ContentCard className="gap-5" density="spacious">
        <Card.Header className="flex-col items-start gap-1 p-0">
          <PanelTitle level={2}>Friend discovery</PanelTitle>
          <Card.Description>
            Turning this off hides you from search. Existing friends are
            unaffected.
          </Card.Description>
        </Card.Header>

        <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl bg-surface-secondary px-4 text-sm font-medium">
          <span>Let other people find me by my email address</span>
          <input
            className="peer sr-only"
            defaultChecked={profile.discoverable}
            name="discoverable"
            type="checkbox"
          />
          <span className="relative h-7 w-12 rounded-full bg-default transition-colors peer-checked:bg-accent after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5" />
        </label>
      </ContentCard>

      <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 rounded-3xl bg-surface/95 p-3 shadow-lg backdrop-blur">
        <span aria-live="polite" className="text-sm text-muted">
          {isPending
            ? "Saving your changes…"
            : state.savedAt && !isDirty
              ? "All changes saved"
              : isDirty
                ? "Unsaved changes"
                : "No changes to save"}
        </span>
        <Button isDisabled={!isDirty} isPending={isPending} type="submit">
          {isPending ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
