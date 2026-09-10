import { z } from "zod";

export const listSchema = z.object({ listId: z.uuid() });

export const stapleNameSchema = z
  .string()
  .trim()
  .min(1, "Name the staple.")
  .max(120, "Keep each staple under 120 characters.");

/** A short onboarding list may be written as lines or as a comma-separated sentence. */
export function parseStapleNames(value: unknown) {
  const pieces = String(value ?? "")
    .split(/[\n,]/)
    .map((name) => name.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const unique = pieces.filter((name) => {
    const key = name.toLocaleLowerCase();

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return z
    .array(stapleNameSchema)
    .max(20, "Start with no more than 20 staples.")
    .safeParse(unique);
}
