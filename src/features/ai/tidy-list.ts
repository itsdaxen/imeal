import { z } from "zod";

/** The model can organize freely within the sections the shopping UI understands. */
export const CATEGORIES = [
  "produce",
  "meat and fish",
  "dairy",
  "bakery",
  "pantry",
  "frozen",
  "drinks",
  "household",
  "other",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** The most a shopping row can hold, matching the check on the column itself. */
const MAX_QUANTITY = 999;

/**
 * The longest proposal that may be sent back to be applied.
 *
 * The reviewed proposal travels to the browser and returns in a hidden field, so it
 * has to fit through a form. Being able to organize a list and then not apply it
 * would be the worst of both, so the evals measure a full one against this.
 */
export const MAX_PROPOSAL = 100_000;

/** A unit describes the measure (`tbsp`), never another amount (`1 tbsp`). */
const UNIT_PATTERN = "^[^\\s0-9¼½¾⅓⅔⅛⅜⅝⅞/][^/]*$";
const unitSchema = z
  .string()
  .trim()
  .min(1)
  .max(30)
  .regex(new RegExp(UNIT_PATTERN), "Unit must not include a leading amount.");

const organizedItemSchema = z.object({
  sourceIds: z.array(z.uuid()).min(1),
  name: z.string().trim().min(1).max(200),
  category: z.enum(CATEGORIES),
  quantity: z.number().int().min(1).max(MAX_QUANTITY),
  unit: unitSchema.nullable(),
  explanation: z.string().trim().min(1).max(240),
});

const omittedItemSchema = z.object({
  sourceIds: z.array(z.uuid()).min(1),
  explanation: z.string().trim().min(1).max(240),
});

export const tidyProposalSchema = z.object({
  items: z.array(organizedItemSchema).max(200),
  omitted: z.array(omittedItemSchema).max(200).default([]),
});

export type OrganizedItem = z.output<typeof organizedItemSchema>;
export type OmittedItem = z.output<typeof omittedItemSchema>;
export type TidyProposal = {
  items: OrganizedItem[];
  /** Optional only for compatibility with proposals created before omissions existed. */
  omitted?: OmittedItem[];
};

export type TidyableItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  checked: boolean;
  category: string | null;
  source?: "generated" | "manual" | "staple";
};

/**
 * The model does the semantic work. This validator only enforces our agreement:
 * every current row is consumed exactly once, and no foreign row is introduced.
 */
export function validateTidyProposal(
  current: ReadonlyArray<TidyableItem>,
  input: unknown,
): TidyProposal | null {
  const parsed = tidyProposalSchema.safeParse(input);

  if (
    !parsed.success ||
    parsed.data.items.length + parsed.data.omitted.length === 0
  ) {
    return null;
  }

  const expected = new Set(current.map((item) => item.id));
  const seen = new Set<string>();

  for (const result of [...parsed.data.items, ...parsed.data.omitted]) {
    for (const id of result.sourceIds) {
      if (!expected.has(id) || seen.has(id)) {
        return null;
      }
      seen.add(id);
    }
  }

  return seen.size === expected.size ? parsed.data : null;
}

/**
 * The short list of things a recipe asks for that no shop sells.
 *
 * Deliberately tiny and literal. Deciding what is purchasable is not the model's
 * job — asked to judge, it throws away bananas. A fixed list, matched whole. Matching
 * on a part of the name would take coconut water, rose water and sparkling water with
 * it, which are all things you buy.
 */
const NOT_PURCHASABLE = new Set([
  "water",
  "cold water",
  "cool water",
  "warm water",
  "hot water",
  "boiling water",
  "tap water",
  "filtered water",
  "cooking water",
  "pasta water",
  "reserved pasta water",
  "ice",
  "ice cubes",
]);

/**
 * Whether a row is one of those, and came from a recipe rather than from you.
 *
 * Something you typed yourself stays whatever you meant by it: a row reading "water"
 * that you added by hand is a bottle of water, and not ours to remove.
 */
export function isNotPurchasable(item: TidyableItem) {
  if (item.source !== "generated") return false;

  return NOT_PURCHASABLE.has(
    item.name
      .toLowerCase()
      .replace(/[.,;:]+$/, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

/** What the reviewed proposal would actually alter. */
export function countChanges(
  items: ReadonlyArray<TidyableItem>,
  proposal: TidyProposal,
): number {
  const before = new Map(items.map((item) => [item.id, item]));

  return (
    (proposal.omitted?.length ?? 0) +
    proposal.items.filter((result) => {
      const original = before.get(result.sourceIds[0]);

      return (
        result.sourceIds.length > 1 ||
        original?.name !== result.name ||
        original?.category !== result.category ||
        original?.quantity !== result.quantity ||
        original?.unit !== result.unit
      );
    }).length
  );
}
