"use client";

import { useActionState } from "react";
import {
  Avatar,
  Button,
  Card,
  Description,
  Input,
  Label,
  TextField,
} from "@heroui/react";

import { FormMessage } from "@/features/auth/components/form-message";
import { ContentCard } from "@/components/ui/content-card";
import { PanelTitle } from "@/components/ui/panel-title";
import { IMAGE_TYPES } from "@/features/images/image";
import { MEAL_SLOTS } from "@/features/recipes/recipe.schema";

import { updateProfile, type ProfileFormState } from "../profile.actions";
import type { Profile } from "../profile.queries";

export function ProfileForm({ profile }: { profile: Profile }) {
  const initials =
    profile.displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?";

  const [state, formAction, isPending] = useActionState<
    ProfileFormState,
    FormData
  >(updateProfile, {});

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.error ? (
        <FormMessage tone="error">{state.error}</FormMessage>
      ) : null}
      {state.saved ? (
        <FormMessage tone="notice">Profile saved.</FormMessage>
      ) : null}

      <ContentCard className="gap-5" density="spacious">
        <Card.Header className="flex-col items-start gap-1 p-0">
          <PanelTitle level={2}>Your identity</PanelTitle>
          <Card.Description>
            This is how friends recognize you across iMeal.
          </Card.Description>
        </Card.Header>

        <div className="grid items-center gap-5 sm:grid-cols-[auto_minmax(0,1fr)]">
          <Avatar className="size-20" variant="soft">
            {profile.avatarUrl ? (
              <Avatar.Image alt="" src={profile.avatarUrl} />
            ) : null}
            <Avatar.Fallback className="bg-identity text-xl text-identity-foreground">
              {initials}
            </Avatar.Fallback>
          </Avatar>

          <div className="flex min-w-0 flex-col gap-2">
            <Label htmlFor="avatar">Profile photograph</Label>
            <div className="rounded-2xl border border-dashed border-border bg-surface-secondary p-3">
              <input
                accept={IMAGE_TYPES.join(",")}
                className="max-w-full text-sm file:mr-3 file:min-h-11 file:rounded-full file:border-0 file:bg-default file:px-4 file:text-sm file:font-medium file:text-foreground"
                id="avatar"
                name="avatar"
                type="file"
              />
            </div>
            <span className="text-xs text-muted">
              JPEG, PNG, WebP or AVIF · 2MB max
            </span>
          </div>
        </div>

        <TextField
          defaultValue={profile.displayName}
          isRequired
          name="displayName"
        >
          <Label>Display name</Label>
          <Input placeholder="How friends will see you" />
          <Description>Friends search for you by this name.</Description>
        </TextField>
      </ContentCard>

      <ContentCard className="gap-5" density="spacious">
        <Card.Header className="flex-col items-start gap-1 p-0">
          <PanelTitle level={2}>Planning defaults</PanelTitle>
          <Card.Description>
            New weeks start from these settings. You can still change any week.
          </Card.Description>
        </Card.Header>

        <div className="grid items-start gap-5 sm:grid-cols-[12rem_1fr]">
          <TextField
            defaultValue={String(profile.defaultMealsPerWeek)}
            isRequired
            name="defaultMealsPerWeek"
            type="number"
          >
            <Label>Meals per week</Label>
            <Input max={28} min={1} />
          </TextField>

          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium text-foreground">
              Meal slots
            </legend>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-4">
              {MEAL_SLOTS.map((slot) => (
                <label
                  className="flex min-h-11 items-center gap-2 text-sm capitalize"
                  key={slot}
                >
                  <input
                    className="size-4 accent-accent"
                    defaultChecked={profile.defaultEnabledSlots.includes(slot)}
                    name="defaultEnabledSlots"
                    type="checkbox"
                    value={slot}
                  />
                  {slot}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </ContentCard>

      <ContentCard className="gap-5" density="spacious">
        <Card.Header className="flex-col items-start gap-1 p-0">
          <PanelTitle level={2}>Friend discovery</PanelTitle>
          <Card.Description>
            Turning this off hides you from search. Existing friends are
            unaffected.
          </Card.Description>
        </Card.Header>

        <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
          <input
            className="size-4 accent-accent"
            defaultChecked={profile.discoverable}
            name="discoverable"
            type="checkbox"
          />
          Let other people find me by name
        </label>
      </ContentCard>

      <div className="flex justify-end">
        <Button isPending={isPending} type="submit">
          {isPending ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
