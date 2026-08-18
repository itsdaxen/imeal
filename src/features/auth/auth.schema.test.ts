import { describe, expect, it } from "vitest";

import { resetPasswordSchema, signInSchema, signUpSchema } from "./auth.schema";

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

describe("resetPasswordSchema", () => {
  it("accepts two matching passwords", () => {
    expect(
      resetPasswordSchema.safeParse({
        password: "long-enough",
        confirmation: "long-enough",
      }).success,
    ).toBe(true);
  });

  it("rejects a mismatch, and says which field is wrong", () => {
    const result = resetPasswordSchema.safeParse({
      password: "long-enough",
      confirmation: "long-enougi",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.path).toEqual(["confirmation"]);
  });

  it("still enforces the minimum length", () => {
    expect(
      resetPasswordSchema.safeParse({
        password: "short",
        confirmation: "short",
      }).success,
    ).toBe(false);
  });
});
