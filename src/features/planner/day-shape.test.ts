import { describe, expect, it } from "vitest";

import { buildDay, mealLabel } from "./day-shape";

describe("buildDay", () => {
  it("is the chosen types in the order they are cooked", () => {
    expect(buildDay(["dinner", "breakfast"], 2)).toEqual([
      "breakfast",
      "dinner",
    ]);
  });

  it("follows the toggles down when a type is turned off", () => {
    expect(buildDay(["lunch", "dinner"], 4)).toHaveLength(4);
    expect(buildDay(["lunch", "dinner"], 2)).toEqual(["lunch", "dinner"]);
  });

  it("never returns fewer meals than the types asked for", () => {
    expect(buildDay(["breakfast", "lunch", "snack", "dinner"], 1)).toHaveLength(
      4,
    );
  });

  it("repeats the main meals when more are wanted than types", () => {
    expect(buildDay(["breakfast", "lunch", "snack", "dinner"], 6)).toEqual([
      "breakfast",
      "lunch",
      "snack",
      "dinner",
      "lunch",
      "dinner",
    ]);
  });

  it("repeats what there is when neither lunch nor dinner is wanted", () => {
    expect(buildDay(["breakfast", "snack"], 4)).toEqual([
      "breakfast",
      "snack",
      "breakfast",
      "snack",
    ]);
  });

  it("has no day at all when nothing is chosen", () => {
    expect(buildDay([], 4)).toEqual([]);
  });
});

describe("mealLabel", () => {
  it("names a meal by its type when the day has only one", () => {
    expect(mealLabel(["breakfast", "lunch", "dinner"], 1)).toBe("Lunch");
  });

  it("numbers a type that appears more than once", () => {
    const day = ["breakfast", "lunch", "dinner", "lunch"] as const;

    expect(mealLabel(day, 1)).toBe("Lunch 1");
    expect(mealLabel(day, 3)).toBe("Lunch 2");
  });
});
