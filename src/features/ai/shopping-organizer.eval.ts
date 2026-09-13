import { describe, expect, it } from "vitest";

import { organizeShoppingList } from "./shopping-organizer";
import type { TidyableItem, TidyProposal } from "./tidy-list";

/**
 * What a good organized list looks like, measured against the real model.
 *
 * Every case asserts a property rather than an exact answer: there is more than one
 * good name for a bag of tomatoes, but there is only one right answer to "did these
 * two rows become one". Each runs several times because the model is not
 * deterministic, and a rule that holds once and fails twice does not hold.
 */
const RUNS = 3;

function item(
  name: string,
  quantity = 1,
  unit: string | null = null,
): TidyableItem {
  return {
    id: crypto.randomUUID(),
    name,
    quantity,
    unit,
    checked: false,
    category: null,
  };
}

/** The group a given source row ended up in. */
function groupOf(proposal: TidyProposal, source: TidyableItem) {
  const found = proposal.items.find((entry) =>
    entry.sourceIds.includes(source.id),
  );

  if (!found) {
    throw new Error(`${source.name} was dropped from the proposal.`);
  }

  return found;
}

const together = (proposal: TidyProposal, a: TidyableItem, b: TidyableItem) =>
  groupOf(proposal, a) === groupOf(proposal, b);

/** An amount in its smallest unit, so an answer can be right in whichever it chose. */
function amountIn(
  scale: Record<string, number>,
  entry: { quantity: number; unit: string | null },
) {
  return entry.quantity * (scale[entry.unit ?? ""] ?? Number.NaN);
}

const inMillilitres = (entry: { quantity: number; unit: string | null }) =>
  amountIn({ ml: 1, cl: 10, dl: 100, l: 1000 }, entry);

const inGrams = (entry: { quantity: number; unit: string | null }) =>
  amountIn({ g: 1, kg: 1000 }, entry);

type Check = (proposal: TidyProposal) => void;

async function measure(items: TidyableItem[], check: Check) {
  const failures: string[] = [];

  for (let run = 0; run < RUNS; run += 1) {
    const result = await organizeShoppingList(items);

    if (!result.ok) {
      failures.push(`run ${run + 1}: the organizer returned ${result.reason}`);
      continue;
    }

    try {
      check(result.value);
    } catch (error) {
      failures.push(
        `run ${run + 1}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return failures;
}

/**
 * A case, and how many bad runs it may have.
 *
 * Safety properties allow none: merging fresh basil into dried is wrong once and
 * wrong always, and a bar that tolerates it is not a bar. Judgement is allowed one
 * run in three, because a model that combines two identical rows nine times in ten is
 * doing the job, and a test insisting on ten would be measuring the weather.
 */
function evaluate(
  name: string,
  items: TidyableItem[],
  check: Check,
  { tolerate = 0 }: { tolerate?: number } = {},
) {
  it(name, async () => {
    const failures = await measure(items, check);

    expect(
      failures.length,
      `${failures.length} of ${RUNS} runs failed:\n${failures.join("\n")}`,
    ).toBeLessThanOrEqual(tolerate);
  });
}

describe("organizing a shopping list", () => {
  const tomatoes = item("tomatoes", 3);
  const tomato = item("Tomato", 2);
  evaluate(
    "combines the same thing written twice",
    [tomatoes, tomato],
    (proposal) => {
      expect(together(proposal, tomatoes, tomato)).toBe(true);
      expect(groupOf(proposal, tomatoes).quantity).toBe(5);
    },
    { tolerate: 1 },
  );

  const fresh = item("fresh basil", 1, "bunch");
  const dried = item("dried basil", 1, "jar");
  evaluate("keeps fresh and dried apart", [fresh, dried], (proposal) => {
    expect(together(proposal, fresh, dried)).toBe(false);
  });

  const breast = item("chicken breast", 500, "g");
  const stock = item("chicken stock", 1, "l");
  evaluate("keeps a meat and its stock apart", [breast, stock], (proposal) => {
    expect(together(proposal, breast, stock)).toBe(false);
  });

  const flour = item("plain flour", 300, "g");
  const moreFlour = item("plain flour", 700, "g");
  evaluate(
    "adds up what it combines",
    [flour, moreFlour],
    (proposal) => {
      const merged = groupOf(proposal, flour);
      const said = `${merged.quantity}${merged.unit ? ` ${merged.unit}` : ""}`;

      expect(together(proposal, flour, moreFlour), `left apart: ${said}`).toBe(
        true,
      );
      expect(inGrams(merged), `said ${said}`).toBe(1000);
    },
    { tolerate: 1 },
  );

  // A quantity stops at 999, so half a litre and a litre has no honest single row.
  const halfLitre = item("milk", 500, "ml");
  const litre = item("milk", 1, "l");
  evaluate(
    "never states a total it cannot hold",
    [halfLitre, litre],
    (proposal) => {
      if (!together(proposal, halfLitre, litre)) {
        expect(groupOf(proposal, halfLitre).quantity).toBe(500);
        expect(groupOf(proposal, litre).quantity).toBe(1);
        return;
      }

      expect(inMillilitres(groupOf(proposal, halfLitre))).toBe(1500);
    },
  );

  const chicken = item("chicken breast", 2);
  const loo = item("loo roll", 1);
  const cheddar = item("cheddar", 200, "g");
  const apples = item("apples", 6);
  evaluate(
    "files each thing under the aisle it is bought in",
    [chicken, loo, cheddar, apples],
    (proposal) => {
      expect(groupOf(proposal, chicken).category).toBe("meat and fish");
      expect(groupOf(proposal, loo).category).toBe("household");
      expect(groupOf(proposal, cheddar).category).toBe("dairy");
      expect(groupOf(proposal, apples).category).toBe("produce");
    },
    { tolerate: 1 },
  );

  const eggs = item("eggs", 12);
  const bread = item("sourdough loaf", 1);
  evaluate("leaves a tidy list alone", [eggs, bread], (proposal) => {
    expect(proposal.items).toHaveLength(2);
    expect(groupOf(proposal, eggs).quantity).toBe(12);
    expect(groupOf(proposal, bread).quantity).toBe(1);
  });
});
