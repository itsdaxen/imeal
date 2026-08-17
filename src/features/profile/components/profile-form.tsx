"use client";

import { useActionState } from "react";
import { Button, Description, Input, Label, TextField } from "@heroui/react";

import { FormMessage } from "@/features/auth/components/form-message";
import { MEAL_SLOTS } from "@/features/recipes/recipe.schema";

import { updateProfile, type ProfileFormState } from "../profile.actions";
import type { Profile } from "../profile.queries";

export function ProfileForm({ profile }: { profile: Profile }) {
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
