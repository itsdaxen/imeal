import { z } from "zod";

import { MEAL_SLOTS } from "@/features/recipes/recipe.schema";

export const slotAssignmentSchema = z.object({
  weekStart: z.iso.date(),
  dayIndex: z.coerce.number().int().min(0).max(6),
  slot: z.enum(MEAL_SLOTS),
  recipeId: z.uuid(),
});

export const slotTargetSchema = slotAssignmentSchema.omit({ recipeId: true });

export type SlotAssignment = z.output<typeof slotAssignmentSchema>;
