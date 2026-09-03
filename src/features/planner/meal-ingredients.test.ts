import { describe, expect, it } from "vitest";

import { ingredientsToAdd } from "./meal-ingredients";

describe("ingredientsToAdd", () => {
  it("adds everything to an empty list", () => {
    expect(ingredientsToAdd(["Leek", "Stock"], [])).toEqual(["Leek", "Stock"]);
  });

  it("leaves out what the list already has", () => {
    expect(ingredientsToAdd(["Leek", "Stock"], ["Stock"])).toEqual(["Leek"]);
  });

  it("matches regardless of case or surrounding space", () => {
    expect(ingredientsToAdd(["Sea Salt"], ["  sea salt "])).toEqual([]);
  });

  it("adds a shared ingredient only once", () => {
    expect(ingredientsToAdd(["Salt", "salt", "Pepper"], [])).toEqual([
      "Salt",
      "Pepper",
    ]);
  });

  it("keeps the recipe's own spelling when it adds", () => {
    expect(ingredientsToAdd(["Sea Salt"], ["Pepper"])).toEqual(["Sea Salt"]);
  });

  it("ignores blank ingredients", () => {
    expect(ingredientsToAdd(["Leek", "   ", ""], [])).toEqual(["Leek"]);
  });
});
