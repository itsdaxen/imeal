import { describe, expect, it } from "vitest";

import { namesToAdd, normalizeName } from "./names";

describe("namesToAdd", () => {
  it("adds everything to an empty list", () => {
    expect(namesToAdd(["Leek", "Stock"], [])).toEqual(["Leek", "Stock"]);
  });

  it("leaves out what the list already has", () => {
    expect(namesToAdd(["Leek", "Stock"], ["Stock"])).toEqual(["Leek"]);
  });

  it("matches regardless of case or surrounding space", () => {
    expect(namesToAdd(["Sea Salt"], ["  sea salt "])).toEqual([]);
  });

  it("adds a shared ingredient only once", () => {
    expect(namesToAdd(["Salt", "salt", "Pepper"], [])).toEqual([
      "Salt",
      "Pepper",
    ]);
  });

  it("keeps the recipe's own spelling when it adds", () => {
    expect(namesToAdd(["Sea Salt"], ["Pepper"])).toEqual(["Sea Salt"]);
  });

  it("ignores blank ingredients", () => {
    expect(namesToAdd(["Leek", "   ", ""], [])).toEqual(["Leek"]);
  });
});

describe("normalizeName", () => {
  it("ignores case and surrounding space", () => {
    expect(normalizeName("  Sea Salt ")).toEqual(normalizeName("sea salt"));
  });

  it("ignores space inside the name as well", () => {
    expect(normalizeName("  olive   oil ")).toEqual(normalizeName("Olive oil"));
  });
});
