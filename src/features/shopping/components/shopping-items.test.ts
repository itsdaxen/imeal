import { describe, expect, it } from "vitest";

import { itemAmount } from "./shopping-items";

describe("itemAmount", () => {
  it("does not repeat an amount embedded in an old unit", () => {
    expect(itemAmount({ quantity: 1, unit: "1 tbsp" })).toBe(" · 1 tbsp");
    expect(itemAmount({ quantity: 2, unit: "500 g" })).toBe(" · 2 × 500 g");
  });

  it("renders a well-formed quantity and unit normally", () => {
    expect(itemAmount({ quantity: 3, unit: "tbsp" })).toBe(" · 3 tbsp");
  });
});
