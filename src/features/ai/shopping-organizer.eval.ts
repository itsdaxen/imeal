import { describe, expect, it } from "vitest";

import { organizeShoppingList } from "./shopping-organizer";
import type { TidyableItem, TidyProposal } from "./tidy-list";

function item(
  name: string,
  quantity = 1,
  unit: string | null = null,
  category: string | null = null,
): TidyableItem {
  return {
    id: crypto.randomUUID(),
    name,
    quantity,
    unit,
    category,
    checked: false,
    source: "generated",
  };
}

function resultFor(proposal: TidyProposal, source: TidyableItem) {
  return proposal.items.find((entry) => entry.sourceIds.includes(source.id));
}

function together(
  proposal: TidyProposal,
  left: TidyableItem,
  right: TidyableItem,
) {
  return resultFor(proposal, left) === resultFor(proposal, right);
}

function expectExactCoverage(proposal: TidyProposal, sources: TidyableItem[]) {
  const covered = [
    ...proposal.items.flatMap((entry) => entry.sourceIds),
    ...(proposal.omitted ?? []).flatMap((entry) => entry.sourceIds),
  ];
  expect(covered).toHaveLength(sources.length);
  expect(new Set(covered)).toEqual(new Set(sources.map((source) => source.id)));
}

describe("shopping organizer quality", () => {
  it(
    "is at least 98% reliable on representative recipe requirements",
    { timeout: 300_000 },
    async () => {
      const cuminA = item("1 tsp ground cumin");
      const cuminB = item("ground cumin", 1, "tsp");
      const peppersA = item("2 bell peppers");
      const peppersB = item("3 bell peppers");
      const garlicA = item("2 garlic cloves");
      const garlicB = item("3 cloves garlic");
      const parmesanA = item("40 g parmesan");
      const parmesanB = item("60 g parmesan cheese");
      const oliveA = item("7 tbsp olive oil");
      const oliveB = item("1 tbsp extra-virgin olive oil");
      const optional = item("optional assorted toppings");
      const pastaWater = item("reserved pasta water");
      const freshBasil = item("fresh basil", 1, "bunch");
      const driedBasil = item("dried basil", 1, "jar");
      const bread = item("4 slices bread");
      const rye = item("4 slices rye bread");
      const cream = item("3 dl cream");
      const heavyCream = item("1 carton heavy cream");
      const neutralOil = item("2 tbsp neutral oil");
      const paprika = item("2 tbsp paprika");
      const smokedPaprika = item("1 tsp smoked paprika");
      const tomatoesByWeight = item("400 g chopped tomatoes");
      const tomatoesByCan = item("1 can chopped tomatoes");
      const list = [
        cuminA,
        cuminB,
        peppersA,
        peppersB,
        garlicA,
        garlicB,
        parmesanA,
        parmesanB,
        oliveA,
        oliveB,
        optional,
        pastaWater,
        freshBasil,
        driedBasil,
        bread,
        rye,
        cream,
        heavyCream,
        neutralOil,
        paprika,
        smokedPaprika,
        tomatoesByWeight,
        tomatoesByCan,
      ];
      let passed = 0;
      let measured = 0;
      const misses: string[] = [];
      const check = (condition: boolean, label: string) => {
        measured += 1;
        if (condition) passed += 1;
        else misses.push(label);
      };

      for (let run = 1; run <= 3; run += 1) {
        const result = await organizeShoppingList(list);
        expect(result.ok ? "ok" : result.reason).toBe("ok");
        if (!result.ok) continue;
        const proposal = result.value;
        expectExactCoverage(proposal, list);
        const omitted = new Set(
          (proposal.omitted ?? []).flatMap((entry) => entry.sourceIds),
        );

        check(together(proposal, cuminA, cuminB), `${run}: cumin merge`);
        check(together(proposal, peppersA, peppersB), `${run}: pepper merge`);
        check(together(proposal, garlicA, garlicB), `${run}: garlic merge`);
        check(
          together(proposal, parmesanA, parmesanB),
          `${run}: parmesan merge`,
        );
        check(together(proposal, oliveA, oliveB), `${run}: olive merge`);
        // Cooking water is on the fixed list of things no shop sells. An
        // "unspecified optional assortment" is not — vague is not the same as
        // unbuyable, and deciding that was what the model kept getting wrong.
        check(omitted.has(pastaWater.id), `${run}: water omission`);
        check(!omitted.has(optional.id), `${run}: optional kept`);
        check(
          !together(proposal, freshBasil, driedBasil),
          `${run}: basil forms`,
        );
        check(!together(proposal, bread, rye), `${run}: bread forms`);
        check(!together(proposal, cream, heavyCream), `${run}: cream forms`);
        check(!together(proposal, oliveA, neutralOil), `${run}: oil forms`);
        check(
          !together(proposal, paprika, smokedPaprika),
          `${run}: paprika forms`,
        );
        check(
          resultFor(proposal, cuminA)?.unit === "jar",
          `${run}: spice purchase`,
        );
        check(
          resultFor(proposal, parmesanA)?.unit === "pack",
          `${run}: cheese purchase`,
        );
        check(
          resultFor(proposal, oliveA)?.unit === "bottle",
          `${run}: oil purchase`,
        );
        check(
          resultFor(proposal, peppersA)?.quantity === 5,
          `${run}: counted total`,
        );
        check(
          together(proposal, tomatoesByWeight, tomatoesByCan) &&
            resultFor(proposal, tomatoesByWeight)?.quantity === 2 &&
            resultFor(proposal, tomatoesByWeight)?.unit === "can",
          `${run}: full package total`,
        );
      }

      expect(
        passed / measured,
        `${passed}/${measured} checks passed; missed ${misses.join(", ")}`,
      ).toBeGreaterThanOrEqual(0.98);
    },
  );

  it(
    "keeps an organized purchase list stable",
    { timeout: 120_000 },
    async () => {
      const list = [
        item("Eggs", 17, null, "dairy"),
        item("Milk", 1, "carton", "dairy"),
        item("Sweet potatoes", 600, "g", "produce"),
        item("Olive oil", 1, "bottle", "pantry"),
        item("Flaky salt", 1, "jar", "pantry"),
        item("Bread", 1, "loaf", "bakery"),
      ];
      const result = await organizeShoppingList(list);
      expect(result.ok ? "ok" : result.reason).toBe("ok");
      if (!result.ok) return;
      expectExactCoverage(result.value, list);

      for (const source of list) {
        expect(resultFor(result.value, source)).toMatchObject({
          quantity: source.quantity,
          unit: source.unit,
        });
      }
    },
  );
});
