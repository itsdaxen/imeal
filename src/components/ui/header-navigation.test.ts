import { describe, expect, it } from "vitest";

import { isCurrentSection } from "./header-navigation";

describe("isCurrentSection", () => {
  it.each([
    ["the root on the root", "/", "/", true],
    ["a section on itself", "/recipes", "/recipes", true],
    ["a section from a child route", "/recipes/abc-123", "/recipes", true],
    [
      "a section from a deeper child",
      "/recipes/abc-123/edit",
      "/recipes",
      true,
    ],
    ["the planner from its assign screen", "/planner/assign", "/planner", true],
  ])("marks %s", (_label, pathname, href, expected) => {
    expect(isCurrentSection(pathname, href)).toBe(expected);
  });

  it.each([
    ["the root from another section", "/recipes", "/", false],
    ["a different section", "/shopping", "/recipes", false],
    [
      "a prefix that is not a path boundary",
      "/recipes-archive",
      "/recipes",
      false,
    ],
    ["a section from an unrelated child", "/catalog/x", "/recipes", false],
  ])("does not mark %s", (_label, pathname, href, expected) => {
    expect(isCurrentSection(pathname, href)).toBe(expected);
  });

  it("keeps the root from swallowing every route", () => {
    const everywhere = [
      "/planner",
      "/shopping",
      "/recipes",
      "/catalog",
      "/friends",
    ];

    expect(everywhere.filter((path) => isCurrentSection(path, "/"))).toEqual(
      [],
    );
  });
});
