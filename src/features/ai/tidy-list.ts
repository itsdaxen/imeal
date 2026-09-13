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
export const MAX_QUANTITY = 999;

export const organizedItemSchema = z.object({
  sourceIds: z.array(z.uuid()).min(1),
  name: z.string().trim().min(1).max(200),
  category: z.enum(CATEGORIES),
  quantity: z.number().int().min(1).max(MAX_QUANTITY),
  unit: z.string().trim().min(1).max(30).nullable(),
  explanation: z.string().trim().min(1).max(240),
});

export const tidyProposalSchema = z.object({
  items: z.array(organizedItemSchema).max(200),
});

export type OrganizedItem = z.output<typeof organizedItemSchema>;
export type TidyProposal = z.output<typeof tidyProposalSchema>;

export type TidyableItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  checked: boolean;
  category: string | null;
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

  if (!parsed.success || parsed.data.items.length === 0) {
    return null;
  }

  const expected = new Set(current.map((item) => item.id));
  const seen = new Set<string>();

  for (const result of parsed.data.items) {
    for (const id of result.sourceIds) {
      if (!expected.has(id) || seen.has(id)) {
        return null;
      }
      seen.add(id);
    }
  }

  return seen.size === expected.size ? parsed.data : null;
}

/** What the reviewed proposal would actually alter. */
export function countChanges(
  items: ReadonlyArray<TidyableItem>,
  proposal: TidyProposal,
): number {
  const before = new Map(items.map((item) => [item.id, item]));

  return proposal.items.filter((result) => {
    const original = before.get(result.sourceIds[0]);

    return (
      result.sourceIds.length > 1 ||
      original?.name !== result.name ||
      original?.category !== result.category ||
      original?.quantity !== result.quantity ||
      original?.unit !== result.unit
    );
  }).length;
}

/**
 * Measures the organizer is allowed to add up, and what one of them is worth.
 *
 * Only the units a shopping list is actually written in. Decilitres are a real
 * measure and a wrong answer: nobody buys 15 dl of milk, so leaving them out keeps
 * the arithmetic from being correct and useless at the same time.
 */
const MEASURES: Record<string, { base: string; per: number }> = {
  ml: { base: "volume", per: 1 },
  l: { base: "volume", per: 1000 },
  g: { base: "mass", per: 1 },
  kg: { base: "mass", per: 1000 },
};

const measureOf = (unit: string | null) =>
  unit ? MEASURES[unit.trim().toLowerCase()] : undefined;

/**
 * Adds up what the model decided to combine.
 *
 * The model is good at knowing that "Tomato" and "tomatoes" are the same shopping,
 * and unreliable at what half a litre plus a litre comes to — it answered 150 ml
 * once and 2 l the time before. Addition is not a judgement, so it is done here
 * instead: the model chooses the grouping, and the code counts it.
 *
 * Nothing is corrected unless the sources and the proposed unit are the same kind of
 * measure. A model that turned six loose apples into "1 bag" has reinterpreted them
 * rather than miscounted, and overruling that would be the same mistake backwards.
 */
export function totalQuantities(
  current: ReadonlyArray<TidyableItem>,
  proposal: TidyProposal,
): TidyProposal {
  const byId = new Map(current.map((item) => [item.id, item]));

  return {
    items: proposal.items.flatMap((entry) => {
      const sources = entry.sourceIds.flatMap((id) => {
        const source = byId.get(id);
        return source ? [source] : [];
      });

      if (sources.length < 2) {
        return entry;
      }

      // Counted things stay counted, and only when the model agrees they are.
      if (
        entry.unit === null &&
        sources.every((source) => source.unit === null)
      ) {
        const counted = sources.reduce(
          (sum, source) => sum + source.quantity,
          0,
        );

        return counted <= MAX_QUANTITY
          ? { ...entry, quantity: counted }
          : entry;
      }

      const measures = sources.map((source) => measureOf(source.unit));
      const base = measures[0]?.base;
      const measured =
        base !== undefined &&
        measures.every((measure) => measure?.base === base);

      // Nothing here can be added up — a bunch and a jar have no total — so whatever
      // the model made of them stands.
      if (!measured) {
        return entry;
      }

      const apart = () =>
        sources.map((source) => ({
          ...entry,
          sourceIds: [source.id],
          name: source.name,
          quantity: source.quantity,
          unit: source.unit,
        }));

      // Rows that were measured stay measured. Answering "2 bottles" for half a litre
      // and a litre is not a total, it is a guess, and there is no way to tell a good
      // one from a bad one afterwards.
      if (measureOf(entry.unit)?.base !== base) {
        return apart();
      }

      const total = sources.reduce(
        (sum, source, index) => sum + source.quantity * measures[index]!.per,
        0,
      );

      // The largest unit the total is a whole number of, so a list says 2 kg rather
      // than 2000 g, and 1500 ml rather than one and a half litres.
      const [unit, measure] =
        Object.entries(MEASURES)
          .filter(([, candidate]) => candidate.base === base)
          .sort(([, a], [, b]) => b.per - a.per)
          .find(([, candidate]) => total % candidate.per === 0) ?? [];

      // No unit can hold the true total — half a litre and a litre is 1500 ml, and a
      // quantity stops at 999. Rather than store a number that is merely close, the
      // rows go back to being separate rows, which is the one answer that is not
      // wrong.
      if (!unit || !measure || total / measure.per > MAX_QUANTITY) {
        return apart();
      }

      return { ...entry, quantity: total / measure.per, unit };
    }),
  };
}
