import { describe, expect, it } from "vitest";

import {
  categorise,
  countChanges,
  tidyList,
  tidyName,
  tidyProposalSchema,
  type TidyableItem,
} from "./tidy-list";

const id = (n: number) => `0000000${n}-0000-4000-8000-000000000000`;

function item(n: number, over: Partial<TidyableItem> = {}): TidyableItem {
  return {
    id: id(n),
    name: `Item ${n}`,
    quantity: 1,
    checked: false,
    category: null,
    ...over,
  };
}

describe("tidyName", () => {
  it("collapses whitespace and capitalises once", () => {
    expect(tidyName("  chopped   tomatoes ")).toBe("Chopped tomatoes");
  });

  it("leaves the rest of the line alone", () => {
    expect(tidyName("500g beef mince")).toBe("500g beef mince");
  });
});

describe("categorise", () => {
  it.each([
    ["Tomatoes", "produce"],
    ["Beef mince", "meat and fish"],
    ["Whole milk", "dairy"],
    ["Sourdough bread", "bakery"],
    ["Dried pasta", "pantry"],
    ["Frozen peas", "frozen"],
    ["Sparkling water", "drinks"],
    ["Washing up soap", "household"],
  ])("puts %s in %s", (name, expected) => {
    expect(categorise(name)).toBe(expected);
  });

  it("falls back rather than guessing", () => {
    expect(categorise("Birthday candles")).toBe("other");
  });
});

describe("tidyList", () => {
  it("merges duplicates that differ only by case or spacing", () => {
    const changes = tidyList([
      item(1, { name: "Tomatoes" }),
      item(2, { name: "tomatoes" }),
      item(3, { name: "  Tomatoes  " }),
    ]);

    expect(changes).toHaveLength(1);
    expect(changes[0].mergedIds).toEqual([id(2), id(3)]);
  });

  it("keeps the first row and folds the others into it", () => {
    const changes = tidyList([
      item(1, { name: "Milk" }),
      item(2, { name: "milk" }),
    ]);

    expect(changes[0].id).toBe(id(1));
  });

  it("adds the quantities of what it merges", () => {
    const changes = tidyList([
      item(1, { name: "Eggs", quantity: 6 }),
      item(2, { name: "eggs", quantity: 6 }),
    ]);

    expect(changes[0].quantity).toBe(12);
  });

  it("never proposes a quantity beyond the column's limit", () => {
    const changes = tidyList([
      item(1, { name: "Rice", quantity: 900 }),
      item(2, { name: "rice", quantity: 900 }),
    ]);

    expect(changes[0].quantity).toBe(999);
  });

  it("leaves distinct items alone", () => {
    expect(
      tidyList([item(1, { name: "Milk" }), item(2, { name: "Bread" })]),
    ).toHaveLength(2);
  });

  it("assigns a category to everything it keeps", () => {
    const changes = tidyList([item(1, { name: "Chicken thighs" })]);

    expect(changes[0].category).toBe("meat and fish");
  });

  it("produces a proposal the schema accepts", () => {
    const changes = tidyList([
      item(1, { name: "Milk" }),
      item(2, { name: "milk" }),
    ]);

    expect(tidyProposalSchema.safeParse({ changes }).success).toBe(true);
  });

  it("proposes nothing for an empty list", () => {
    expect(tidyList([])).toEqual([]);
  });
});

describe("countChanges", () => {
  it("counts a merge", () => {
    const items = [item(1, { name: "Milk" }), item(2, { name: "milk" })];

    expect(countChanges(items, tidyList(items))).toBe(1);
  });

  it("counts a rename", () => {
    const items = [item(1, { name: "  milk " })];

    expect(countChanges(items, tidyList(items))).toBe(1);
  });

  it("counts a newly filled category", () => {
    const items = [item(1, { name: "Milk", category: null })];

    expect(countChanges(items, tidyList(items))).toBe(1);
  });

  it("reports nothing when the list is already tidy", () => {
    const items = [item(1, { name: "Milk", category: "dairy" })];

    expect(countChanges(items, tidyList(items))).toBe(0);
  });
});
