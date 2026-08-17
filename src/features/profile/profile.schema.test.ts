import { describe, expect, it } from "vitest";

import { parseProfileForm } from "./profile.schema";

function form(entries: Array<[string, string]>) {
  const data = new FormData();

  for (const [key, value] of entries) {
    data.append(key, value);
  }

  return data;
}

const valid: Array<[string, string]> = [
  ["displayName", "  Ada  "],
  ["defaultMealsPerWeek", "7"],
  ["defaultEnabledSlots", "lunch"],
  ["defaultEnabledSlots", "dinner"],
  ["discoverable", "on"],
];

describe("parseProfileForm", () => {
  it("trims the display name and collects the checked slots", () => {
    const result = parseProfileForm(form(valid));

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.displayName).toBe("Ada");
    expect(result.data.defaultEnabledSlots).toEqual(["lunch", "dinner"]);
    expect(result.data.defaultMealsPerWeek).toBe(7);
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
    ["no meal slots", [["defaultEnabledSlots", ""]]],
    ["an unknown slot", [["defaultEnabledSlots", "brunch"]]],
    ["zero meals a week", [["defaultMealsPerWeek", "0"]]],
    ["more meals than we track", [["defaultMealsPerWeek", "29"]]],
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
