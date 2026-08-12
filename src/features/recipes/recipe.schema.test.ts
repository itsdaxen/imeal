import { describe, expect, it } from "vitest";

import { parseRecipeForm, recipeInputSchema } from "./recipe.schema";

function form(overrides: Record<string, string | string[]> = {}) {
  const data = new FormData();
  const base: Record<string, string | string[]> = {
    title: "  Tomato pasta  ",
    ingredients: "Pasta\n  Tomatoes  \n\nBasil\n",
    steps: "Boil water\nCook pasta",
    tip: "",
    prepMinutes: "25",
    servings: "2",
    mealTags: ["dinner"],
    ...overrides,
  };

  for (const [key, value] of Object.entries(base)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      data.append(key, item);
    }
  }

  return data;
}

describe("parseRecipeForm", () => {
  it("splits lines, trims them, and drops blanks", () => {
    const result = parseRecipeForm(form());

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.ingredients).toEqual(["Pasta", "Tomatoes", "Basil"]);
    expect(result.data.title).toBe("Tomato pasta");
  });

  it("coerces the numeric fields FormData delivers as strings", () => {
    const result = parseRecipeForm(form());

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.prepMinutes).toBe(25);
    expect(result.data.servings).toBe(2);
  });

  it("turns an empty tip into null rather than an empty string", () => {
    const result = parseRecipeForm(form());

    expect(result.success && result.data.tip).toBeNull();
  });

  it.each([
    ["a blank title", { title: "   " }],
    ["ingredients that are only whitespace", { ingredients: "  \n \n" }],
    ["no steps", { steps: "" }],
    ["no meal tags", { mealTags: [] }],
    ["an unknown meal tag", { mealTags: ["brunch"] }],
    ["zero servings", { servings: "0" }],
    ["a prep time beyond a day", { prepMinutes: "1441" }],
  ])("rejects %s", (_label, overrides) => {
    expect(parseRecipeForm(form(overrides)).success).toBe(false);
  });
});

describe("recipeInputSchema", () => {
  it("keeps ingredient order", () => {
    const result = recipeInputSchema.safeParse({
      title: "Soup",
      ingredients: "Onion\nStock\nSalt",
      steps: "Simmer",
      tip: "",
      prepMinutes: 10,
      servings: 1,
      mealTags: ["lunch"],
    });

    expect(result.success && result.data.ingredients).toEqual([
      "Onion",
      "Stock",
      "Salt",
    ]);
  });
});
