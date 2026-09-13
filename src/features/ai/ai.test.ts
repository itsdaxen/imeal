import { describe, expect, it } from "vitest";

import { readRecipe } from "./ai";
import { MAX_PASTED_CHARACTERS } from "./draft-recipe";

const RECIPE = `Roast chicken
Serves 4 · 90 minutes

Ingredients
1 chicken
2 lemons

Method
Roast it.
Rest it.`;

describe("readRecipe", () => {
  it("reads a pasted recipe", () => {
    const result = readRecipe(RECIPE);

    expect(result.ok && result.value.title).toBe("Roast chicken");
  });

  it("refuses a paste that is too long before parsing it", () => {
    const result = readRecipe("x".repeat(MAX_PASTED_CHARACTERS + 1));

    expect(result).toEqual({ ok: false, reason: "too-long" });
  });

  it("says so when there is no recipe in there", () => {
    expect(readRecipe("hello there")).toEqual({
      ok: false,
      reason: "unreadable",
    });
  });
});
