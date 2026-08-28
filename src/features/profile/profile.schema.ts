import { z } from "zod";

import { MEAL_SLOTS } from "@/features/recipes/recipe.schema";

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Give yourself a display name.")
    .max(80, "Keep the display name under 80 characters."),
  discoverable: z.coerce.boolean(),
  defaultMealsPerWeek: z.coerce
    .number()
    .int()
    .min(1, "Plan at least one meal a week.")
    .max(28, "Twenty-eight is the most we track."),
  defaultEnabledSlots: z
    .array(z.enum(MEAL_SLOTS))
    .min(1, "Keep at least one meal slot."),
});

export type ProfileInput = z.output<typeof profileSchema>;

export function parseProfileForm(formData: FormData) {
  return profileSchema.safeParse({
    // An unchecked checkbox sends nothing, so absence means false.
    discoverable: formData.get("discoverable") === "on",
    displayName: formData.get("displayName") ?? "",
    defaultMealsPerWeek: formData.get("defaultMealsPerWeek") ?? "",
    defaultEnabledSlots: formData.getAll("defaultEnabledSlots"),
  });
}

export const deleteAccountSchema = z.object({
  confirmation: z.literal("DELETE", {
    error: "Type DELETE exactly to confirm.",
  }),
});

export function parseDeleteAccountForm(formData: FormData) {
  return deleteAccountSchema.safeParse({
    confirmation: formData.get("confirmation"),
  });
}
