import { afterEach, describe, expect, it, vi } from "vitest";

import { organizeShoppingList } from "./shopping-organizer";
import type { TidyableItem } from "./tidy-list";

const first = "00000001-0000-4000-8000-000000000000";
const second = "00000002-0000-4000-8000-000000000000";
const items: TidyableItem[] = [
  {
    id: first,
    name: "2 tbsp basil",
    quantity: 1,
    unit: null,
    checked: false,
    category: null,
  },
  {
    id: second,
    name: "2 tablespoons fresh basil",
    quantity: 1,
    unit: null,
    checked: false,
    category: null,
  },
];

function apiResponse(value: unknown, ok = true, status = ok ? 200 : 400) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue({
      output: [
        {
          content: [{ type: "output_text", text: JSON.stringify(value) }],
        },
      ],
    }),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("organizeShoppingList", () => {
  it("accepts a complete structured model proposal", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        apiResponse({
          items: [
            {
              sourceKeys: ["item_1", "item_2"],
              name: "Fresh basil",
              category: "produce",
              quantity: 1,
              unit: "bunch",
              explanation: "Combined the fresh basil into one purchase.",
            },
          ],
        }),
      ),
    );

    const result = await organizeShoppingList(items);

    expect(result.ok && result.value.items[0].unit).toBe("bunch");
    expect(fetch).toHaveBeenCalledWith(
      "https://api.openai.com/v1/responses",
      expect.objectContaining({ method: "POST" }),
    );
    const request = JSON.parse(
      vi.mocked(fetch).mock.calls[0][1]?.body as string,
    );
    expect(request.model).toBe("gpt-5-nano");
    expect(request.input).not.toContain(first);
    expect(request.input).toContain("item_1");
  });

  it("rejects a proposal that silently drops a source", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        apiResponse({
          items: [
            {
              sourceKeys: ["item_1"],
              name: "Fresh basil",
              category: "produce",
              quantity: 1,
              unit: "bunch",
              explanation: "Converted basil to a purchase unit.",
            },
          ],
        }),
      ),
    );

    expect(await organizeShoppingList(items)).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("leaves the list untouched when the model is unavailable", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(apiResponse({}, false)));

    expect(await organizeShoppingList(items)).toEqual({
      ok: false,
      reason: "unavailable",
    });
  });

  it("reports a missing key as configuration rather than an outage", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");

    expect(await organizeShoppingList(items)).toEqual({
      ok: false,
      reason: "configuration",
    });
  });
});
