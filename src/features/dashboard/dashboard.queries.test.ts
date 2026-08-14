import { describe, expect, it } from "vitest";

import { selectNextMeal } from "./dashboard.queries";

const meal = (
  dayIndex: number,
  slot: "breakfast" | "lunch" | "snack" | "dinner",
) => ({
  dayIndex,
  slot,
  id: `${dayIndex}-${slot}`,
});

describe("selectNextMeal", () => {
  it("returns nothing when the week is empty", () => {
    expect(selectNextMeal([], 0)).toBeUndefined();
  });

  it("orders by slot within a day rather than by insertion", () => {
    const meals = [meal(2, "dinner"), meal(2, "breakfast"), meal(2, "lunch")];

    expect(selectNextMeal(meals, 0)?.id).toBe("2-breakfast");
  });

  it("skips days already past", () => {
    const meals = [meal(0, "dinner"), meal(4, "lunch")];

    expect(selectNextMeal(meals, 3)?.id).toBe("4-lunch");
  });

  it("includes today", () => {
    const meals = [meal(3, "dinner"), meal(5, "lunch")];

    expect(selectNextMeal(meals, 3)?.id).toBe("3-dinner");
  });

  it("returns nothing when the rest of the week is empty", () => {
    expect(selectNextMeal([meal(1, "dinner")], 4)).toBeUndefined();
  });

  it("treats a day index outside the week as the start of it", () => {
    expect(selectNextMeal([meal(0, "lunch")], -1)?.id).toBe("0-lunch");
  });

  it("does not mutate the input order", () => {
    const meals = [meal(6, "dinner"), meal(1, "lunch")];
    selectNextMeal(meals, 0);

    expect(meals[0].id).toBe("6-dinner");
  });
});
