"use client";

import { useActionState } from "react";
import {
  Avatar,
  Button,
  Description,
  Input,
  Label,
  TextField,
} from "@heroui/react";

import { FormMessage } from "@/features/auth/components/form-message";
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

      <div className="flex items-center gap-4">
        <Avatar size="lg" variant="soft">
          {profile.avatarUrl ? (
            <Avatar.Image alt="" src={profile.avatarUrl} />
          ) : null}
          <Avatar.Fallback className="bg-identity text-identity-foreground">
            {initials}
          </Avatar.Fallback>
        </Avatar>

        <div className="flex min-w-0 flex-col gap-1">
          <Label htmlFor="avatar">Photograph</Label>
          <input
            accept={IMAGE_TYPES.join(",")}
            className="max-w-full text-sm file:mr-3 file:min-h-11 file:rounded-full file:border-0 file:bg-default file:px-4 file:text-sm file:font-medium file:text-foreground"
            id="avatar"
            name="avatar"
            type="file"
          />
          <span className="text-sm text-muted">
            JPEG, PNG, WebP or AVIF, up to 2MB.
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

      <TextField
        className="w-48"
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
          Slots you plan by default
        </legend>
        <div className="flex flex-wrap gap-4">
          {MEAL_SLOTS.map((slot) => (
            <label
              className="flex min-h-11 items-center gap-2 pr-3 text-sm capitalize"
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

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-foreground">
          Discoverability
        </legend>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            className="size-4 accent-accent"
            defaultChecked={profile.discoverable}
            name="discoverable"
            type="checkbox"
          />
          Let other people find me by name
        </label>
        <p className="text-sm text-muted">
          Turning this off hides you from search. Existing friends are
          unaffected.
        </p>
      </fieldset>

      <Button className="self-start" isPending={isPending} type="submit">
        {isPending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
