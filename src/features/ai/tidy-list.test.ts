import { describe, expect, it } from "vitest";

import {
  countChanges,
  type OrganizedItem,
  type TidyProposal,
  type TidyableItem,
  validateTidyProposal,
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
    const proposal = { items: [result([id(1), id(2)])], omitted: [] };

    expect(validateTidyProposal(items, proposal)).toEqual(proposal);
  });

  it("accepts an explicit omission as accounting for its source", () => {
    const items = [item(1), item(2)];
    const proposal = {
      items: [result([id(1)])],
      omitted: [
        {
          sourceIds: [id(2)],
          explanation: "Reserved cooking water is not a purchase.",
        },
      ],
    };

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

  it("rejects a compound unit invented from incompatible sources", () => {
    expect(
      validateTidyProposal([item(1)], {
        items: [result([id(1)], { unit: "bag/tbsp" })],
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
