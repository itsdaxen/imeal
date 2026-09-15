import { afterEach, describe, expect, it, vi } from "vitest";

import { organizeShoppingList } from "./shopping-organizer";
import type { TidyableItem } from "./tidy-list";

const ids = Array.from(
  { length: 12 },
  (_, index) =>
    `000000${String(index + 1).padStart(2, "0")}-0000-4000-8000-000000000000`,
);

function item(
  index: number,
  name: string,
  quantity = 1,
  unit: string | null = null,
): TidyableItem {
  return {
    id: ids[index]!,
    name,
    quantity,
    unit,
    checked: false,
    category: null,
  };
}

function apiResponse(value: unknown, ok = true) {
  return {
    ok,
    json: vi.fn().mockResolvedValue({
      output: [
        {
          content: [{ type: "output_text", text: JSON.stringify(value) }],
        },
      ],
    }),
  };
}

function normalized(
  entries: Array<{
    name?: string;
    category?: string;
    quantity?: number;
    unit?: string | null;
    omit?: boolean;
  }>,
) {
  return {
    items: entries.flatMap((entry, index) =>
      entry.omit
        ? []
        : [
            {
              sourceKey: `source_${index + 1}`,
              name: entry.name,
              category: entry.category,
              quantity: entry.quantity,
              unit: entry.unit ?? null,
              explanation: "Normalized purchase.",
            },
          ],
    ),
    omitted: entries.flatMap((entry, index) =>
      entry.omit
        ? [
            {
              sourceKey: `source_${index + 1}`,
              explanation: "Not something to buy.",
            },
          ]
        : [],
    ),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("organizeShoppingList", () => {
  it("normalizes small batches and asks AI only about duplicate candidates", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        apiResponse(
          normalized([
            {
              name: "Parmesan",
              category: "dairy",
              quantity: 1,
              unit: "pack",
            },
            {
              name: "Parmesan cheese",
              category: "dairy",
              quantity: 1,
              unit: "pack",
            },
            { name: "Carrots", category: "produce", quantity: 2 },
          ]),
        ),
      )
      .mockResolvedValueOnce(
        apiResponse({
          items: [
            {
              candidateKeys: ["candidate_1_source_1", "candidate_1_source_2"],
              name: "Parmesan",
              category: "dairy",
              quantity: 1,
              unit: "pack",
              explanation: "Same product and one bottle is sufficient.",
            },
          ],
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await organizeShoppingList([
      item(0, "40 g parmesan"),
      item(1, "60 g parmesan cheese"),
      item(2, "2 carrots"),
    ]);

    expect(result.ok && result.value.items).toHaveLength(2);
    expect(result.ok && result.value.items[0]).toMatchObject({
      sourceIds: [ids[0], ids[1]],
      name: "Parmesan",
      quantity: 1,
      unit: "pack",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstRequest = JSON.parse(fetchMock.mock.calls[0]![1].body);
    const secondRequest = JSON.parse(fetchMock.mock.calls[1]![1].body);
    expect(JSON.parse(firstRequest.input).items).toHaveLength(3);
    expect(JSON.parse(secondRequest.input).candidates).toHaveLength(2);
    expect(firstRequest.model).toBe("gpt-5.6-luna");
    expect(firstRequest.reasoning).toEqual({ effort: "none" });
  });

  it("does not spend a reconciliation call on unrelated products", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue(
      apiResponse(
        normalized([
          { name: "Milk", category: "dairy", quantity: 1, unit: "carton" },
          { name: "Carrots", category: "produce", quantity: 2 },
        ]),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await organizeShoppingList([
      item(0, "500 ml milk"),
      item(1, "2 carrots"),
    ]);

    expect(result.ok && result.value.items).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("consolidates identical normalized products without another AI call", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue(
      apiResponse(
        normalized([
          { name: "Mango", category: "produce", quantity: 1 },
          { name: "Mango", category: "produce", quantity: 1 },
        ]),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await organizeShoppingList([
      item(0, "one ripe mango"),
      item(1, "1 mango, diced"),
    ]);

    expect(result.ok && result.value.items).toEqual([
      expect.objectContaining({
        sourceIds: [ids[0], ids[1]],
        name: "Mango",
        quantity: 2,
        unit: null,
      }),
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps checked and open rows separate", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue(
      apiResponse(
        normalized([
          { name: "Tomatoes", category: "produce", quantity: 2 },
          { name: "Tomatoes", category: "produce", quantity: 3 },
        ]),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await organizeShoppingList([
      { ...item(0, "tomatoes", 2), checked: true },
      item(1, "tomato", 3),
    ]);

    expect(result.ok && result.value.items).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("preserves structured quantities when an already tidy list is run again", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        apiResponse(
          normalized([
            { name: "Eggs", category: "dairy", quantity: 1 },
            { name: "Sweet potatoes", category: "produce", quantity: 2 },
          ]),
        ),
      ),
    );

    const result = await organizeShoppingList([
      { ...item(0, "Eggs", 17), category: "dairy" },
      { ...item(1, "Sweet potatoes", 600, "g"), category: "produce" },
    ]);

    expect(result.ok && result.value.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Eggs", quantity: 17, unit: null }),
        expect.objectContaining({
          name: "Sweet potatoes",
          quantity: 600,
          unit: "g",
        }),
      ]),
    );
  });

  // What a shop sells is not a judgement, so it is settled before anything is asked.
  it("omits what no shop sells without asking the model", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        apiResponse(
          normalized([
            { name: "Pasta", category: "pantry", quantity: 1, unit: "pack" },
          ]),
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await organizeShoppingList([
      { ...item(0, "reserved pasta water"), source: "generated" },
      { ...item(1, "250 g pasta"), source: "generated" },
    ]);

    expect(result.ok && result.value.omitted?.[0]?.sourceIds).toEqual([ids[0]]);
    expect(result.ok && result.value.items[0]?.sourceIds).toEqual([ids[1]]);

    const sent = JSON.parse(JSON.parse(fetchMock.mock.calls[0][1].body).input);
    expect(JSON.stringify(sent)).not.toContain("pasta water");
  });

  it("keeps a row you added yourself, whatever it is called", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        apiResponse(
          normalized([
            {
              name: "Water",
              category: "drinks",
              quantity: 1,
              unit: "bottle",
            },
          ]),
        ),
      ),
    );

    const result = await organizeShoppingList([
      { ...item(0, "water"), source: "manual" },
    ]);

    expect(result.ok && result.value.omitted).toEqual([]);
    expect(result.ok && result.value.items[0]?.sourceIds).toEqual([ids[0]]);
  });

  it("limits every normalization request to ten source rows", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const fetchMock = vi.fn().mockImplementation(async (_url, init) => {
      const request = JSON.parse(init.body);
      const input = JSON.parse(request.input);
      return apiResponse(
        normalized(
          input.items.map((entry: { name: string }) => ({
            name: entry.name.replace("source", "product"),
            category: "pantry",
            quantity: 1,
            unit: "pack",
          })),
        ),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await organizeShoppingList(
      Array.from({ length: 11 }, (_, index) => item(index, `source-${index}`)),
    );

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const call of fetchMock.mock.calls) {
      const request = JSON.parse(call[1].body);
      expect(JSON.parse(request.input).items.length).toBeLessThanOrEqual(10);
    }
  });

  it("leaves a batch it could not read as it was", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        apiResponse(
          normalized([
            { name: "Milk", category: "dairy", quantity: 1, unit: "carton" },
          ]),
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await organizeShoppingList([
      item(0, "milk"),
      item(1, "bread"),
    ]);

    // Both rows survive, untouched, rather than the whole list refusing to organize.
    expect(result.ok).toBe(true);
    expect(
      result.ok &&
        result.value.items.flatMap((entry) => entry.sourceIds).sort(),
    ).toEqual([ids[0], ids[1]].sort());
    expect(
      result.ok && result.value.items.map((entry) => entry.name).sort(),
    ).toEqual(["bread", "milk"]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("reports configuration, service, and timeout failures", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    await expect(organizeShoppingList([item(0, "milk")])).resolves.toEqual({
      ok: false,
      reason: "configuration",
    });

    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(apiResponse({}, false)));
    await expect(organizeShoppingList([item(0, "milk")])).resolves.toEqual({
      ok: false,
      reason: "unavailable",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("Timed out", "AbortError")),
    );
    await expect(organizeShoppingList([item(0, "milk")])).resolves.toEqual({
      ok: false,
      reason: "timeout",
    });
  });
});
