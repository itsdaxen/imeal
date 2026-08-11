import { describe, expect, it } from "vitest";

import { safeInternalPath } from "./safe-redirect";

const FALLBACK = "/home";

describe("safeInternalPath", () => {
  it("keeps an ordinary internal path", () => {
    expect(safeInternalPath("/recipes?tag=dinner", FALLBACK)).toBe(
      "/recipes?tag=dinner",
    );
  });

  it.each([
    ["nothing", undefined],
    ["an empty string", ""],
    ["an absolute url", "https://evil.test/x"],
    ["a scheme-relative url", "//evil.test"],
    ["a backslash host", "/\\evil.test"],
    ["a mixed slash host", "/\\/evil.test"],
    ["a path containing a backslash", "/recipes\\..\\evil"],
    ["a header injection attempt", "/recipes\nSet-Cookie: x=1"],
    ["a bare word", "recipes"],
  ])("falls back for %s", (_label, value) => {
    expect(safeInternalPath(value, FALLBACK)).toBe(FALLBACK);
  });
});
