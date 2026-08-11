import { describe, expect, it } from "vitest";
import { z } from "zod";

import { parseEnv } from "./env";

const schema = z.object({
  API_URL: z.url(),
  API_KEY: z.string().min(1),
});

describe("parseEnv", () => {
  it("returns the parsed values when the source is valid", () => {
    expect(
      parseEnv(schema, { API_URL: "https://example.com", API_KEY: "secret" }),
    ).toEqual({ API_URL: "https://example.com", API_KEY: "secret" });
  });

  it("names every invalid variable", () => {
    const failing = () =>
      parseEnv(schema, { API_URL: "not-a-url", API_KEY: "" });

    expect(failing).toThrow(/API_URL/);
    expect(failing).toThrow(/API_KEY/);
  });

  it("does not leak values into the error", () => {
    expect(() =>
      parseEnv(schema, { API_URL: "http://x.test", API_KEY: "" }),
    ).not.toThrow(/http:\/\/x\.test/);
  });
});
