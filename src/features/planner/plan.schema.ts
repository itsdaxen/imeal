import { z } from "zod";

import { MEAL_SLOTS } from "@/features/recipes/recipe.schema";

export const slotAssignmentSchema = z.object({
  weekStart: z.iso.date(),
  dayIndex: z.coerce.number().int().min(0).max(6),
  slot: z.enum(MEAL_SLOTS),
  recipeId: z.uuid(),
});

export const slotTargetSchema = slotAssignmentSchema.omit({ recipeId: true });

export const GENERATION_SOURCES = ["mine", "catalog", "both"] as const;

export type GenerationSource = (typeof GENERATION_SOURCES)[number];

export const generationSchema = z.object({
  weekStart: z.iso.date(),
  source: z.enum(GENERATION_SOURCES),
  slots: z.array(z.enum(MEAL_SLOTS)).min(1, "Choose at least one meal slot."),
  listId: z.uuid().optional(),
});

export const mealSchema = z.object({
  weekStart: z.iso.date(),
  itemId: z.uuid(),
});

export type SlotAssignment = z.output<typeof slotAssignmentSchema>;
