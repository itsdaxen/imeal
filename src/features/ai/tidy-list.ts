import { z } from "zod";

/** A closed set, so a proposal can never invent a category. */
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

export const tidyChangeSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(200),
  category: z.enum(CATEGORIES),
  quantity: z.number().int().min(1).max(999),
  mergedIds: z.array(z.uuid()),
});

export const tidyProposalSchema = z.object({
  changes: z.array(tidyChangeSchema),
});

export type TidyChange = z.output<typeof tidyChangeSchema>;

export type TidyableItem = {
  id: string;
  name: string;
  quantity: number;
  checked: boolean;
  category: string | null;
};

const KEYWORDS: Array<[Category, RegExp]> = [
  [
    "produce",
    /\b(apple|banana|tomato|onion|garlic|potato|carrot|lettuce|spinach|herb|basil|lemon|lime|pepper|mushroom|cucumber|salad|fruit|veg)/i,
  ],
  [
    "meat and fish",
    /\b(beef|mince|chicken|pork|lamb|bacon|sausage|fish|salmon|tuna|prawn|steak)/i,
  ],
  ["dairy", /\b(milk|cheese|butter|yoghurt|yogurt|cream|egg)/i],
  ["bakery", /\b(bread|roll|bagel|baguette|pastry|croissant|cake)/i],
  ["frozen", /\b(frozen|ice cream|peas)/i],
  ["drinks", /\b(water|juice|coffee|tea|wine|beer|soda|cola)/i],
  ["household", /\b(soap|detergent|towel|foil|bag|cleaner|paper)/i],
  [
    "pantry",
    /\b(pasta|rice|flour|sugar|salt|oil|vinegar|spice|stock|sauce|noodle)|\b(tin|can|bean|lentil)s?\b/i,
  ],
];

export function categorise(name: string): Category {
  return KEYWORDS.find(([, pattern]) => pattern.test(name))?.[0] ?? "other";
}

/** Collapses whitespace and gives the line one capital, without rewording it. */
export function tidyName(name: string): string {
  const collapsed = name.replace(/\s+/g, " ").trim();

  return collapsed.charAt(0).toUpperCase() + collapsed.slice(1);
}

/**
 * Proposes a tidied list: duplicates merged, names normalised, categories filled in.
 *
 * It only ever returns a proposal. Nothing here writes, because the contract is that
 * the user sees what would change before anything does.
 */
export function tidyList(items: ReadonlyArray<TidyableItem>): TidyChange[] {
  const survivors = new Map<string, TidyChange & { checked: boolean }>();

  for (const item of items) {
    const name = tidyName(item.name);
    const key = name.toLowerCase();
    const existing = survivors.get(key);

    if (existing) {
      existing.quantity = Math.min(999, existing.quantity + item.quantity);
      existing.mergedIds.push(item.id);
      existing.checked = existing.checked && item.checked;
      continue;
    }

    survivors.set(key, {
      id: item.id,
      name,
      category: categorise(name),
      quantity: item.quantity,
      mergedIds: [],
      checked: item.checked,
    });
  }

  return [...survivors.values()].map(
    ({ checked: _checked, ...change }) => change,
  );
}

/** What the proposal would actually alter, so an empty tidy can say so. */
export function countChanges(
  items: ReadonlyArray<TidyableItem>,
  changes: ReadonlyArray<TidyChange>,
): number {
  const before = new Map(items.map((item) => [item.id, item]));

  return changes.filter((change) => {
    const original = before.get(change.id);

    return (
      change.mergedIds.length > 0 ||
      original?.name !== change.name ||
      original?.category !== change.category ||
      original?.quantity !== change.quantity
    );
  }).length;
}
