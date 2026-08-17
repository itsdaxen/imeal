import { describe, expect, it } from "vitest";

import { pickReplacement, planWeek, type PlannableRecipe } from "./generate";

// Deterministic: keeps input order so assertions describe behaviour, not luck.
const inOrder = <T>(items: ReadonlyArray<T>): T[] => [...items];

function recipes(
  count: number,
  tags: PlannableRecipe["mealTags"],
): PlannableRecipe[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${tags.join("-")}-${index}`,
    mealTags: tags,
  }));
}

describe("planWeek", () => {
  it("fills every day of a slot", () => {
    const result = planWeek({
      recipes: recipes(7, ["dinner"]),
      shuffle: inOrder,
      slots: ["dinner"],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.assignments).toHaveLength(7);
    expect(result.assignments.map((meal) => meal.dayIndex)).toEqual([
      0, 1, 2, 3, 4, 5, 6,
    ]);
  });

  it("never repeats a recipe within the week", () => {
    const result = planWeek({
      recipes: recipes(20, ["lunch", "dinner"]),
      shuffle: inOrder,
      slots: ["lunch", "dinner"],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const used = result.assignments.map((meal) => meal.recipeId);
    expect(new Set(used).size).toBe(used.length);
  });

  it("refuses rather than half-filling a week", () => {
    const result = planWeek({
      recipes: recipes(4, ["dinner"]),
      shuffle: inOrder,
      slots: ["dinner"],
    });

    expect(result).toEqual({
      ok: false,
      slot: "dinner",
      available: 4,
      needed: 7,
    });
  });

  it("names the slot that came up short, not the first one", () => {
    const result = planWeek({
      recipes: [...recipes(7, ["lunch"]), ...recipes(2, ["dinner"])],
      shuffle: inOrder,
      slots: ["lunch", "dinner"],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.slot).toBe("dinner");
    expect(result.available).toBe(2);
  });

  it("only asks for the days an approved meal has not already taken", () => {
    const result = planWeek({
      locked: [{ dayIndex: 0, slot: "dinner", recipeId: "kept" }],
      recipes: recipes(6, ["dinner"]),
      shuffle: inOrder,
      slots: ["dinner"],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.assignments).toHaveLength(6);
    expect(result.assignments.map((meal) => meal.dayIndex)).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
  });

  it("does not reuse a recipe an approved meal is already using", () => {
    const pool = recipes(7, ["dinner"]);
    const result = planWeek({
      locked: [{ dayIndex: 0, slot: "dinner", recipeId: pool[0].id }],
      recipes: pool,
      shuffle: inOrder,
      slots: ["dinner"],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.assignments.map((meal) => meal.recipeId)).not.toContain(
      pool[0].id,
    );
  });

  it("leaves a fully approved slot alone", () => {
    const locked = Array.from({ length: 7 }, (_, dayIndex) => ({
      dayIndex,
      slot: "dinner" as const,
      recipeId: `kept-${dayIndex}`,
    }));
    const result = planWeek({
      locked,
      recipes: recipes(7, ["dinner"]),
      shuffle: inOrder,
      slots: ["dinner"],
    });

    expect(result.ok && result.assignments).toEqual([]);
  });

  it("ignores recipes that do not suit the slot", () => {
    const result = planWeek({
      recipes: [...recipes(7, ["breakfast"]), ...recipes(7, ["dinner"])],
      shuffle: inOrder,
      slots: ["dinner"],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(
      result.assignments.every((meal) => meal.recipeId.startsWith("dinner")),
    ).toBe(true);
  });
});

describe("pickReplacement", () => {
  it("returns a recipe the week is not already using", () => {
    const pool = recipes(3, ["dinner"]);

    expect(
      pickReplacement({
        current: pool[0].id,
        planned: [{ dayIndex: 0, slot: "dinner", recipeId: pool[1].id }],
        recipes: pool,
        shuffle: inOrder,
        slot: "dinner",
      }),
    ).toBe(pool[2].id);
  });

  it("returns nothing when there is no alternative", () => {
    const pool = recipes(1, ["dinner"]);

    expect(
      pickReplacement({
        current: pool[0].id,
        planned: [],
        recipes: pool,
        shuffle: inOrder,
        slot: "dinner",
      }),
    ).toBeNull();
  });

  it("will not offer a recipe that does not suit the slot", () => {
    expect(
      pickReplacement({
        current: "x",
        planned: [],
        recipes: recipes(5, ["breakfast"]),
        shuffle: inOrder,
        slot: "dinner",
      }),
    ).toBeNull();
  });
});
