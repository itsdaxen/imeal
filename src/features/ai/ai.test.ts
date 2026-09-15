import { afterEach, describe, expect, it, vi } from "vitest";

import { readRecipe } from "./ai";
import { MAX_PASTED_CHARACTERS } from "./draft-recipe";

const RECIPE = `Roast chicken
Serves 4 · 90 minutes

Ingredients
1 chicken
2 lemons

Method
Roast it.
Rest it.`;

describe("readRecipe", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("reads a pasted recipe with structured model output", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          output: [
            {
              content: [
                {
                  type: "output_text",
                  text: JSON.stringify({
                    title: "Roast chicken",
                    ingredients: ["1 chicken", "2 lemons"],
                    steps: ["Roast it.", "Rest it."],
                    tip: null,
                    prepMinutes: 90,
                    servings: 4,
                    mealTags: ["dinner"],
                  }),
                },
              ],
            },
          ],
        }),
      }),
    );

    const result = await readRecipe(RECIPE);

    expect(result.ok && result.value.title).toBe("Roast chicken");
    expect(result.ok && result.mode).toBe("model");
    const request = JSON.parse(
      vi.mocked(fetch).mock.calls[0][1]?.body as string,
    );
    expect(request.model).toBe("gpt-5.6-luna");
    expect(request.reasoning).toEqual({ effort: "none" });
    expect(request.text.format.type).toBe("json_schema");
    expect(request.input).toBe(RECIPE);
  });

  it("refuses a paste that is too long before calling the model", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn());
    const result = await readRecipe("x".repeat(MAX_PASTED_CHARACTERS + 1));

    expect(result).toEqual({ ok: false, reason: "too-long" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("says so when the paste is empty", async () => {
    expect(await readRecipe("  \n ")).toEqual({
      ok: false,
      reason: "unreadable",
    });
  });

  it("rejects model output that does not satisfy the recipe contract", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          output: [
            {
              content: [
                {
                  type: "output_text",
                  text: JSON.stringify({ title: "Soup" }),
                },
              ],
            },
          ],
        }),
      }),
    );

    expect(await readRecipe(RECIPE)).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("reports a model timeout", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("Timed out", "TimeoutError")),
    );

    expect(await readRecipe(RECIPE)).toEqual({
      ok: false,
      reason: "timeout",
    });
  });

  it("keeps local import available when a developer has no API key", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");

    const result = await readRecipe(RECIPE);

    expect(result.ok && result.mode).toBe("local");
    expect(result.ok && result.value.title).toBe("Roast chicken");
  });
});
