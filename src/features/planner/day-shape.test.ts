import { describe, expect, it } from "vitest";

import type { MealSlot } from "@/features/recipes/recipe.schema";

import { buildDay, mealLabel, reshapeWeek, sameEveryDay } from "./day-shape";

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

describe("reshapeWeek", () => {
  const oldDay: MealSlot[] = ["breakfast", "lunch", "snack", "dinner"];
  const newDay: MealSlot[] = ["lunch", "snack", "dinner", "lunch"];

  it("moves the days that still follow the old default", () => {
    expect(reshapeWeek(sameEveryDay(oldDay), oldDay, newDay)).toEqual(
      sameEveryDay(newDay),
    );
  });

  it("leaves a day that was given a meal of its own", () => {
    const week = sameEveryDay(oldDay);
    week[2] = [...oldDay, "dinner"];

    const reshaped = reshapeWeek(week, oldDay, newDay);

    expect(reshaped[2]).toEqual([...oldDay, "dinner"]);
    expect(reshaped[0]).toEqual(newDay);
  });

  it("treats a reordered day as one you shaped yourself", () => {
    const week = sameEveryDay(["lunch", "breakfast", "snack", "dinner"]);

    expect(reshapeWeek(week, oldDay, newDay)[0]).toEqual([
      "lunch",
      "breakfast",
      "snack",
      "dinner",
    ]);
  });
});
