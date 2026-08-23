import { describe, expect, it } from "vitest";

import { draftRecipeFromText, draftRecipeSchema } from "./draft-recipe";

const pasted = `Grandma's Ragu
Serves 6 · 90 minutes

Ingredients
- 500g beef mince
- 2 tins chopped tomatoes
* 1 onion

Method
1. Brown the mince in a heavy pan.
2. Add the tomatoes and simmer for an hour.
3. Season and serve.

Tip
Better the next day.`;

describe("draftRecipeFromText", () => {
  it("reads the title from the first line", () => {
    expect(draftRecipeFromText(pasted)?.title).toBe("Grandma's Ragu");
  });

  it("separates ingredients from steps by their headings", () => {
    const draft = draftRecipeFromText(pasted);

    expect(draft?.ingredients).toEqual([
      "500g beef mince",
      "2 tins chopped tomatoes",
      "1 onion",
    ]);
    expect(draft?.steps).toHaveLength(3);
    expect(draft?.steps[0]).toBe("Brown the mince in a heavy pan.");
  });

  it("strips bullets and numbering", () => {
    const draft = draftRecipeFromText(pasted);

    expect(draft?.ingredients.some((line) => /^[-*•]/.test(line))).toBe(false);
    expect(draft?.steps.some((line) => /^\d+[.)]/.test(line))).toBe(false);
  });

  it("picks up servings and time when the text mentions them", () => {
    const draft = draftRecipeFromText(pasted);

    expect(draft?.servings).toBe(6);
    expect(draft?.prepMinutes).toBe(90);
  });

  it("reads hours when there are no minutes", () => {
    expect(
      draftRecipeFromText(
        "Stew\nIngredients\n- Beef\nMethod\nCook for 2 hours.",
      )?.prepMinutes,
    ).toBe(120);
  });

  it("falls back to sensible defaults when nothing is stated", () => {
    const draft = draftRecipeFromText(
      "Toast\nIngredients\n- Bread\nSteps\nToast it.",
    );

    expect(draft?.servings).toBe(4);
    expect(draft?.prepMinutes).toBe(30);
  });

  it("does not mistake a servings line for an ingredient", () => {
    const draft = draftRecipeFromText(pasted);

    expect(draft?.ingredients.some((line) => /serves/i.test(line))).toBe(false);
  });

  it("captures a tip when the text has one", () => {
    expect(draftRecipeFromText(pasted)?.tip).toBe("Better the next day.");
  });

  it("leaves the tip empty when there is none", () => {
    expect(
      draftRecipeFromText("Toast\nIngredients\n- Bread\nSteps\nToast it.")?.tip,
    ).toBeNull();
  });

  it("returns nothing for text it cannot read as a recipe", () => {
    expect(draftRecipeFromText("")).toBeNull();
    expect(draftRecipeFromText("   \n  \n")).toBeNull();
    expect(draftRecipeFromText("Just a title and nothing else")).toBeNull();
  });

  it("guesses without headings, treating short lines as ingredients", () => {
    const draft = draftRecipeFromText(
      [
        "Quick Eggs",
        "- 2 eggs",
        "- butter",
        "Melt the butter in a pan over a low heat and scramble the eggs slowly until just set.",
      ].join("\n"),
    );

    expect(draft?.ingredients).toEqual(["2 eggs", "butter"]);
    expect(draft?.steps).toHaveLength(1);
  });

  it("refuses to run away with a very long paste", () => {
    const draft = draftRecipeFromText(
      `Big\nIngredients\n${"- x\n".repeat(5000)}Steps\nCook.`,
    );

    // Truncation can cut the steps section off entirely, which is a refusal.
    expect(draft === null || draft.ingredients.length <= 60).toBe(true);
  });

  it("produces something the schema accepts", () => {
    const draft = draftRecipeFromText(pasted);

    expect(draftRecipeSchema.safeParse(draft).success).toBe(true);
  });
});

describe("draftRecipeSchema", () => {
  const valid = {
    title: "Ragu",
    ingredients: ["Beef"],
    steps: ["Simmer"],
    tip: null,
    prepMinutes: 30,
    servings: 4,
    mealTags: ["dinner"],
  };

  it("accepts a well-formed draft", () => {
    expect(draftRecipeSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ["no ingredients", { ingredients: [] }],
    ["no steps", { steps: [] }],
    ["no meal tags", { mealTags: [] }],
    ["an unknown meal tag", { mealTags: ["brunch"] }],
    ["zero servings", { servings: 0 }],
    ["a fractional prep time", { prepMinutes: 12.5 }],
    ["a prep time beyond a day", { prepMinutes: 2000 }],
  ])("rejects %s", (_label, override) => {
    expect(draftRecipeSchema.safeParse({ ...valid, ...override }).success).toBe(
      false,
    );
  });
});
