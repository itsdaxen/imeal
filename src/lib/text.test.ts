import { describe, expect, it } from "vitest";

import { escapeLikePattern, initialsOf } from "./text";

describe("initialsOf", () => {
  it("takes the first letter of the first two words", () => {
    expect(initialsOf("Ada Lovelace King")).toBe("AL");
  });

  it("handles a single name", () => {
    expect(initialsOf("Farzam")).toBe("F");
  });

  it("ignores surrounding and repeated whitespace", () => {
    expect(initialsOf("  ada   lovelace  ")).toBe("AL");
  });

  it("falls back when there is no name to read", () => {
    expect(initialsOf("   ")).toBe("?");
  });

  it("uppercases the way the locale expects", () => {
    expect(initialsOf("île de france")).toBe("ÎD");
  });
});

describe("escapeLikePattern", () => {
  it("leaves ordinary text alone", () => {
    expect(escapeLikePattern("tomato")).toBe("tomato");
  });

  it("escapes the wildcards a search term must not smuggle in", () => {
    expect(escapeLikePattern("100%")).toBe("100\\%");
    expect(escapeLikePattern("a_b")).toBe("a\\_b");
  });

  it("escapes the escape character itself", () => {
    expect(escapeLikePattern("back\\slash")).toBe("back\\\\slash");
  });
});
