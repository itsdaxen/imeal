import { describe, expect, it } from "vitest";

import { parseStapleNames } from "./shopping.schema";

describe("parseStapleNames", () => {
  it("accepts lines and commas, trims them, and removes case-insensitive repeats", () => {
    const result = parseStapleNames(" Milk\nOlive oil, milk , Coffee ");

    expect(result.success && result.data).toEqual([
      "Milk",
      "Olive oil",
      "Coffee",
    ]);
  });

  it("treats a blank list as an intentional skip", () => {
    const result = parseStapleNames("  \n  ");

    expect(result.success && result.data).toEqual([]);
  });

  it("limits the initial list to twenty staples", () => {
    const result = parseStapleNames(
      Array.from({ length: 21 }, (_, index) => `Staple ${index}`).join(","),
    );

    expect(result.success).toBe(false);
  });
});
