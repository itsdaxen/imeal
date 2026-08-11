import { describe, expect, it } from "vitest";

import { signInSchema, signUpSchema } from "./auth.schema";

describe("signInSchema", () => {
  it("accepts an email and any non-empty password", () => {
    expect(
      signInSchema.safeParse({ email: "cook@example.test", password: "x" })
        .success,
    ).toBe(true);
  });

  it("rejects a malformed email", () => {
    expect(
      signInSchema.safeParse({ email: "cook", password: "x" }).success,
    ).toBe(false);
  });
});

describe("signUpSchema", () => {
  it("accepts a valid account without a display name", () => {
    expect(
      signUpSchema.safeParse({
        email: "cook@example.test",
        password: "long-enough",
      }).success,
    ).toBe(true);
  });

  it("requires at least eight characters", () => {
    expect(
      signUpSchema.safeParse({ email: "cook@example.test", password: "short" })
        .success,
    ).toBe(false);
  });

  it("rejects a password bcrypt would silently truncate", () => {
    expect(
      signUpSchema.safeParse({
        email: "cook@example.test",
        password: "a".repeat(73),
      }).success,
    ).toBe(false);
  });
});
