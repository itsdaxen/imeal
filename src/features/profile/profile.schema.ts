import { z } from "zod";

import { MEAL_SLOTS } from "@/features/recipes/recipe.schema";
import { MAX_MEALS_PER_DAY } from "@/features/planner/day-shape";

const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Give yourself a display name.")
    .max(80, "Keep the display name under 80 characters."),
  discoverable: z.coerce.boolean(),
  defaultMealsPerDay: z.coerce
    .number()
    .int()
    .min(1, "Plan at least one meal a day.")
    .max(MAX_MEALS_PER_DAY, "Twelve meals is the most a day can hold."),
  defaultMealTypes: z
    .array(z.enum(MEAL_SLOTS))
    .min(1, "Keep at least one kind of meal."),
});

export function parseProfileForm(formData: FormData) {
  return profileSchema.safeParse({
    // An unchecked checkbox sends nothing, so absence means false.
    discoverable: formData.get("discoverable") === "on",
    displayName: formData.get("displayName") ?? "",
    defaultMealsPerDay: formData.get("defaultMealsPerDay") ?? "",
    defaultMealTypes: formData.getAll("defaultMealTypes"),
  });
}

const deleteAccountSchema = z.object({
  confirmation: z.literal("DELETE", {
    error: "Type DELETE exactly to confirm.",
  }),
});

export function parseDeleteAccountForm(formData: FormData) {
  return deleteAccountSchema.safeParse({
    confirmation: formData.get("confirmation"),
  });
}
