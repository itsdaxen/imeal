import { z } from "zod";

import {
  CATEGORIES,
  totalQuantities,
  validateTidyProposal,
  type TidyableItem,
  type TidyProposal,
} from "./tidy-list";

const MAX_ITEMS = 200;
const DEFAULT_MODEL = "gpt-5-nano";

/**
 * Written as rules rather than prose.
 *
 * The first version said all of this in one paragraph, and the one line that mattered
 * most — do not merge things that are only nearly the same — was buried in the middle
 * of it. Every rule here earns its place by being one the model broke, and the first
 * two pull against each other on purpose: warned only about merging too much, it
 * stopped combining two rows that both said plain flour.
 */
const INSTRUCTIONS = `You organize a grocery shopping list into what someone actually buys.

Together, the sourceKeys of your results must contain every input key exactly once: none missing, none repeated. Count them before you answer.

1. Rows naming the same product in the same form are one result, however they are written: "Tomato" and "tomatoes" are one line, and so are two rows that both say "plain flour". Add their quantities.
2. quantity is a whole number, so when a total is not whole in the larger unit, answer in the smaller one: 500 ml plus 1 l is 1500 ml, not 2 l and not 1 l.
3. Never combine different forms or different products. Fresh and dried herbs are different. A meat and a stock made from it are different. Frozen and fresh are different.
4. A row you did not combine keeps its quantity and unit.
5. Name each result the way it is sold, and give it the unit it is sold in. Use null for things that are simply counted.
6. Put each result in the aisle it is bought from, choosing from the given categories.
7. Explain in a few words what you did with it.`;

const modelProposalSchema = z.object({
  items: z
    .array(
      z.object({
        sourceKeys: z.array(z.string()).min(1),
        name: z.string().trim().min(1).max(200),
        category: z.enum(CATEGORIES),
        quantity: z.number().int().min(1).max(999),
        unit: z.string().trim().min(1).max(30).nullable(),
        explanation: z.string().trim().min(1).max(240),
      }),
    )
    .max(MAX_ITEMS),
});

function outputSchema(sourceKeys: string[]) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["items"],
    properties: {
      items: {
        type: "array",
        maxItems: MAX_ITEMS,
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "sourceKeys",
            "name",
            "category",
            "quantity",
            "unit",
            "explanation",
          ],
          properties: {
            sourceKeys: {
              type: "array",
              minItems: 1,
              items: { type: "string", enum: sourceKeys },
            },
            name: { type: "string", minLength: 1, maxLength: 200 },
            category: { type: "string", enum: CATEGORIES },
            quantity: { type: "integer", minimum: 1, maximum: 999 },
            unit: {
              anyOf: [
                { type: "string", minLength: 1, maxLength: 30 },
                { type: "null" },
              ],
            },
            explanation: { type: "string", minLength: 1, maxLength: 240 },
          },
        },
      },
    },
  } as const;
}

function outputText(response: unknown) {
  if (!response || typeof response !== "object" || !("output" in response)) {
    return null;
  }

  const output = (response as { output?: unknown }).output;
  if (!Array.isArray(output)) return null;

  for (const item of output) {
    if (!item || typeof item !== "object" || !("content" in item)) continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;

    for (const part of content) {
      if (
        part &&
        typeof part === "object" &&
        "type" in part &&
        part.type === "output_text" &&
        "text" in part &&
        typeof part.text === "string"
      ) {
        return part.text;
      }
    }
  }

  return null;
}

export type OrganizerResult =
  | { ok: true; value: TidyProposal }
  | {
      ok: false;
      reason:
        | "nothing-to-do"
        | "too-many-items"
        | "configuration"
        | "busy"
        | "timeout"
        | "unavailable"
        | "invalid";
    };

type RequestFailure = Extract<OrganizerResult, { ok: false }>;

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function requestOrganization(
  key: string,
  items: ReadonlyArray<TidyableItem>,
) {
  const keyedItems = items.map((item, index) => ({
    key: `item_${index + 1}`,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    currentCategory: item.category,
  }));
  let lastFailure: RequestFailure = { ok: false, reason: "unavailable" };

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_ORGANIZER_MODEL || DEFAULT_MODEL,
          // Minimal effort spends no reasoning tokens at all, and it showed: the
          // model dropped rows out of the partition and added 500 ml to 1 l to get
          // 2 l. Low is the cheapest setting that actually thinks about the list.
          reasoning: { effort: "low" },
          store: false,
          max_output_tokens: 12_000,
          instructions: INSTRUCTIONS,
          input: JSON.stringify({
            categories: CATEGORIES,
            items: keyedItems,
          }),
          text: {
            format: {
              type: "json_schema",
              name: "shopping_list_organization",
              strict: true,
              schema: outputSchema(keyedItems.map(({ key }) => key)),
            },
          },
        }),
        signal: AbortSignal.timeout(45_000),
      });

      if (response.ok) return { ok: true as const, response };

      if (response.status === 401 || response.status === 403) {
        return { ok: false as const, reason: "configuration" as const };
      }

      lastFailure = {
        ok: false,
        reason: response.status === 429 ? "busy" : "unavailable",
      };

      if (
        attempt === 0 &&
        (response.status === 429 || response.status >= 500)
      ) {
        await wait(750);
        continue;
      }

      return lastFailure;
    } catch (error) {
      lastFailure = {
        ok: false,
        reason:
          error instanceof DOMException &&
          (error.name === "TimeoutError" || error.name === "AbortError")
            ? "timeout"
            : "unavailable",
      };

      if (attempt === 0) {
        await wait(750);
        continue;
      }
    }
  }

  return lastFailure;
}

async function attemptOrganization(
  key: string,
  items: ReadonlyArray<TidyableItem>,
): Promise<OrganizerResult> {
  try {
    const requested = await requestOrganization(key, items);
    if (!requested.ok) return requested;

    const text = outputText(await requested.response.json());
    if (!text) return { ok: false, reason: "invalid" };

    const decoded: unknown = JSON.parse(text);
    const shaped = modelProposalSchema.safeParse(decoded);
    if (!shaped.success) return { ok: false, reason: "invalid" };

    const idsByKey = new Map(
      items.map((item, index) => [`item_${index + 1}`, item.id]),
    );
    const mapped = {
      items: shaped.data.items.map(({ sourceKeys, ...item }) => ({
        ...item,
        sourceIds: sourceKeys.flatMap((sourceKey) => {
          const id = idsByKey.get(sourceKey);
          return id ? [id] : [];
        }),
      })),
    };

    const proposal = validateTidyProposal(items, mapped);
    return proposal
      ? { ok: true, value: totalQuantities(items, proposal) }
      : { ok: false, reason: "invalid" };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

export async function organizeShoppingList(
  items: ReadonlyArray<TidyableItem>,
): Promise<OrganizerResult> {
  if (items.length === 0) return { ok: false, reason: "nothing-to-do" };
  if (items.length > MAX_ITEMS) {
    return { ok: false, reason: "too-many-items" };
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) return { ok: false, reason: "configuration" };

  // About one proposal in twenty does not account for every row, and the guard
  // throws it away. Asking a second time costs a moment and turns most of those
  // into an answer, without loosening what is accepted.
  const attempt = await attemptOrganization(key, items);

  return attempt.ok || attempt.reason !== "invalid"
    ? attempt
    : attemptOrganization(key, items);
}
