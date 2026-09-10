import { z } from "zod";

import { MEAL_SLOTS } from "@/features/recipes/recipe.schema";
import { MAX_MEALS_PER_DAY } from "./day-shape";

/**
 * A position carried by a form field, which must actually be carried.
 *
 * `z.coerce.number()` reads a missing field as `Number(null)` — zero — and zero is a
 * perfectly valid position, so a caller that forgot to send one was silently told to
 * act on the first meal of the day instead of being turned away. That is how "remove
 * this meal" came to remove a different one.
 */
const position = (max: number) =>
  z.preprocess(
    (value) =>
      value === null || value === undefined || value === "" ? NaN : value,
    z.coerce.number().int().min(0).max(max),
  );

export const slotAssignmentSchema = z.object({
  weekStart: z.iso.date(),
  dayIndex: position(6),
  /** Which meal of the day, since a day may hold two lunches. */
  slotIndex: position(MAX_MEALS_PER_DAY - 1),
  slot: z.enum(MEAL_SLOTS),
  recipeId: z.uuid(),
});

export const slotTargetSchema = slotAssignmentSchema.omit({ recipeId: true });

export const GENERATION_SOURCES = ["mine", "catalog", "both"] as const;

export type GenerationSource = (typeof GENERATION_SOURCES)[number];

export const generationSchema = z.object({
  weekStart: z.iso.date(),
  source: z.enum(GENERATION_SOURCES),
  slots: z
    .array(z.enum(MEAL_SLOTS))
    .min(1, "Choose at least one kind of meal."),
  mealsPerDay: z.coerce.number().int().min(1).max(MAX_MEALS_PER_DAY).optional(),
  listId: z.uuid().optional(),
});

export const mealSchema = z.object({
  weekStart: z.iso.date(),
  itemId: z.uuid(),
});

export type SlotAssignment = z.output<typeof slotAssignmentSchema>;
