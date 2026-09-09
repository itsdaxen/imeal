import { describe, expect, it } from "vitest";

import { parseDeleteAccountForm, parseProfileForm } from "./profile.schema";

function form(entries: Array<[string, string]>) {
  const data = new FormData();

  for (const [key, value] of entries) {
    data.append(key, value);
  }

  return data;
}

const valid: Array<[string, string]> = [
  ["displayName", "  Ada  "],
  ["defaultMealsPerDay", "4"],
  ["defaultMealTypes", "lunch"],
  ["defaultMealTypes", "dinner"],
  ["discoverable", "on"],
];

describe("parseProfileForm", () => {
  it("trims the display name and collects the checked slots", () => {
    const result = parseProfileForm(form(valid));

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.displayName).toBe("Ada");
    expect(result.data.defaultMealTypes).toEqual(["lunch", "dinner"]);
    expect(result.data.defaultMealsPerDay).toBe(4);
  });

  it("treats a checked box as discoverable", () => {
    const result = parseProfileForm(form(valid));

    expect(result.success && result.data.discoverable).toBe(true);
  });

  it("treats an absent checkbox as not discoverable", () => {
    // An unchecked checkbox sends no field at all, which is the only signal.
    const result = parseProfileForm(
      form(valid.filter(([key]) => key !== "discoverable")),
    );

    expect(result.success && result.data.discoverable).toBe(false);
  });

  it.each([
    ["a blank display name", [["displayName", "   "]]],
    ["no kinds of meal", [["defaultMealTypes", ""]]],
    ["an unknown kind of meal", [["defaultMealTypes", "brunch"]]],
    ["zero meals a day", [["defaultMealsPerDay", "0"]]],
    ["more meals than a day holds", [["defaultMealsPerDay", "13"]]],
  ])("rejects %s", (_label, overrides) => {
    const keys = new Set(
      (overrides as Array<[string, string]>).map(([key]) => key),
    );
    const entries = valid
      .filter(([key]) => !keys.has(key))
      .concat(overrides as Array<[string, string]>);

    expect(parseProfileForm(form(entries)).success).toBe(false);
  });
});

describe("parseDeleteAccountForm", () => {
  it("requires the exact destructive confirmation", () => {
    expect(
      parseDeleteAccountForm(form([["confirmation", "DELETE"]])).success,
    ).toBe(true);
    expect(
      parseDeleteAccountForm(form([["confirmation", "delete"]])).success,
    ).toBe(false);
  });
});
