import { describe, expect, it } from "vitest";

import {
  countChanges,
  separateCollected,
  totalQuantities,
  validateTidyProposal,
  type OrganizedItem,
  type TidyableItem,
  type TidyProposal,
} from "./tidy-list";

const id = (n: number) => `0000000${n}-0000-4000-8000-000000000000`;

function item(n: number, over: Partial<TidyableItem> = {}): TidyableItem {
  return {
    id: id(n),
    name: `Item ${n}`,
    quantity: 1,
    unit: null,
    checked: false,
    category: null,
    ...over,
  };
}

function result(
  sourceIds: string[],
  over: Partial<OrganizedItem> = {},
): OrganizedItem {
  return {
    sourceIds,
    name: "Fresh basil",
    category: "produce",
    quantity: 1,
    unit: "bunch",
    explanation: "Combined compatible fresh basil requirements.",
    ...over,
  };
}

describe("validateTidyProposal", () => {
  it("accepts a proposal that consumes every source exactly once", () => {
    const items = [item(1), item(2)];
    const proposal = { items: [result([id(1), id(2)])] };

    expect(validateTidyProposal(items, proposal)).toEqual(proposal);
  });

  it("rejects a missing source item", () => {
    expect(
      validateTidyProposal([item(1), item(2)], {
        items: [result([id(1)])],
      }),
    ).toBeNull();
  });

  it("rejects repeated source IDs", () => {
    expect(
      validateTidyProposal([item(1)], {
        items: [result([id(1)]), result([id(1)])],
      }),
    ).toBeNull();
  });

  it("rejects a source outside the current list", () => {
    expect(
      validateTidyProposal([item(1)], {
        items: [result([id(1), id(2)])],
      }),
    ).toBeNull();
  });

  it("rejects categories and quantities outside the agreement", () => {
    expect(
      validateTidyProposal([item(1)], {
        items: [
          {
            ...result([id(1)]),
            category: "garden",
            quantity: 0,
          },
        ],
      }),
    ).toBeNull();
  });

  it("rejects an amount repeated inside the unit", () => {
    expect(
      validateTidyProposal([item(1)], {
        items: [result([id(1)], { quantity: 1, unit: "1 tbsp" })],
      }),
    ).toBeNull();
  });
});

describe("countChanges", () => {
  it("counts model merges and conversions", () => {
    const items = [
      item(1, { name: "2 tbsp basil" }),
      item(2, { name: "2 tablespoons fresh basil" }),
    ];
    const proposal: TidyProposal = {
      items: [result([id(1), id(2)])],
    };

    expect(countChanges(items, proposal)).toBe(1);
  });

  it("reports no change when every persisted field matches", () => {
    const items = [
      item(1, {
        name: "Milk",
        quantity: 1,
        unit: "carton",
        category: "dairy",
      }),
    ];
    const proposal: TidyProposal = {
      items: [
        result([id(1)], {
          name: "Milk",
          quantity: 1,
          unit: "carton",
          category: "dairy",
        }),
      ],
    };

    expect(countChanges(items, proposal)).toBe(0);
  });
});

describe("totalQuantities", () => {
  const totalFor = (items: TidyableItem[], over: Partial<OrganizedItem> = {}) =>
    totalQuantities(items, {
      items: [
        result(
          items.map((entry) => entry.id),
          over,
        ),
      ],
    }).items[0];

  it("counts things that have no unit", () => {
    const summed = totalFor(
      [item(1, { quantity: 3 }), item(2, { quantity: 2 })],
      { unit: null },
    );

    expect(summed.quantity).toBe(5);
    expect(summed.unit).toBeNull();
  });

  it("adds quantities that already share a unit", () => {
    expect(
      totalFor(
        [
          item(1, { quantity: 100, unit: "g" }),
          item(2, { quantity: 200, unit: "g" }),
        ],
        { unit: "g" },
      ).quantity,
    ).toBe(300);
  });

  it("separates rows again when no unit can hold their total", () => {
    const split = totalQuantities(
      [
        item(1, { name: "milk", quantity: 500, unit: "ml" }),
        item(2, { name: "milk", quantity: 1, unit: "l" }),
      ],
      {
        items: [
          result([id(1), id(2)], { name: "milk", quantity: 2, unit: "l" }),
        ],
      },
    ).items;

    expect(split).toHaveLength(2);
    expect(split[0]).toMatchObject({ quantity: 500, unit: "ml" });
    expect(split[1]).toMatchObject({ quantity: 1, unit: "l" });
    expect(split[0].explanation).toBe(
      "Left as it was: no single amount covers both.",
    );
  });

  it("answers in the largest unit that stays whole", () => {
    const summed = totalFor(
      [
        item(1, { quantity: 500, unit: "g" }),
        item(2, { quantity: 1500, unit: "g" }),
      ],
      { unit: "g" },
    );

    expect(summed).toMatchObject({ quantity: 2, unit: "kg" });
  });

  it("leaves measures it cannot add alone", () => {
    const summed = totalFor(
      [
        item(1, { quantity: 1, unit: "bunch" }),
        item(2, { quantity: 1, unit: "jar" }),
      ],
      { quantity: 7, unit: "bunch" },
    );

    expect(summed).toMatchObject({ quantity: 7, unit: "bunch" });
  });

  it("separates measured rows the model answered in something else", () => {
    const split = totalQuantities(
      [
        item(1, { name: "milk", quantity: 500, unit: "ml" }),
        item(2, { name: "milk", quantity: 1, unit: "l" }),
      ],
      {
        items: [
          result([id(1), id(2)], { name: "milk", quantity: 2, unit: "bottle" }),
        ],
      },
    ).items;

    expect(split).toHaveLength(2);
    expect(split.map((entry) => entry.unit)).toEqual(["ml", "l"]);
  });

  it("leaves a reinterpreted unit alone", () => {
    const summed = totalFor(
      [item(1, { quantity: 3 }), item(2, { quantity: 3 })],
      { quantity: 1, unit: "bag" },
    );

    expect(summed).toMatchObject({ quantity: 1, unit: "bag" });
  });

  it("leaves a row that was not combined with anything", () => {
    const summed = totalFor([item(1, { quantity: 3, unit: "g" })], {
      quantity: 9,
      unit: "g",
    });

    expect(summed).toMatchObject({ quantity: 9, unit: "g" });
  });

  it("keeps counted things within what a quantity can hold", () => {
    const summed = totalFor(
      [item(1, { quantity: 900 }), item(2, { quantity: 900 })],
      { quantity: 7, unit: null },
    );

    expect(summed).toMatchObject({ quantity: 7 });
  });
});

describe("separateCollected", () => {
  const split = (items: TidyableItem[]) =>
    separateCollected(items, {
      items: [
        result(
          items.map((entry) => entry.id),
          { quantity: 5 },
        ),
      ],
    }).items;

  it("explains the separation rather than the merge that did not happen", () => {
    const parts = split([
      item(1, { checked: true }),
      item(2, { checked: false }),
    ]);

    expect(parts.map((part) => part.explanation)).toEqual([
      "Kept apart from what is already in the trolley.",
      "Kept apart from what is already in the trolley.",
    ]);
  });

  it("keeps what is bought apart from what is not", () => {
    const parts = split([
      item(1, { quantity: 2, checked: true }),
      item(2, { quantity: 3, checked: false }),
    ]);

    expect(parts).toHaveLength(2);
    expect(parts[0].sourceIds).toEqual([id(2)]);
    expect(parts[1].sourceIds).toEqual([id(1)]);
  });

  it("leaves a merge of things all still to buy", () => {
    expect(
      split([item(1, { checked: false }), item(2, { checked: false })]),
    ).toHaveLength(1);
  });

  it("leaves a merge of things all already bought", () => {
    expect(
      split([item(1, { checked: true }), item(2, { checked: true })]),
    ).toHaveLength(1);
  });

  it("leaves a row that was not merged with anything", () => {
    expect(split([item(1, { checked: true })])).toHaveLength(1);
  });
});
