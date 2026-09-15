import {
  draftRecipeFromText,
  draftRecipeSchema,
  MAX_PASTED_CHARACTERS,
  type DraftRecipe,
} from "./draft-recipe";

export type AiMode = "local" | "model";

export type AiResult<T> =
  | { ok: true; mode: AiMode; value: T }
  | {
      ok: false;
      reason:
        | "too-long"
        | "unreadable"
        | "nothing-to-do"
        | "configuration"
        | "busy"
        | "timeout"
        | "unavailable"
        | "invalid";
    };

const DEFAULT_MODEL = "gpt-5.6-luna";

const INSTRUCTIONS = `Read the pasted recipe and return an accurate structured draft.

1. Use only information supported by the paste. Do not add ingredients, instructions, or a tip.
2. Remove webpage navigation, advertisements, anecdotes, nutrition tables, and repeated content.
3. Keep ingredient quantities and units in each ingredient string.
4. Turn the cooking method into concise, complete steps in the original order.
5. prepMinutes means the total elapsed time. When no time is given, use 30.
6. When no serving count is given, use 4.
7. Choose every meal tag clearly suitable for the recipe. Use lunch and dinner when the paste gives no useful signal.
8. Keep the recipe's language; do not translate it.`;

const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "ingredients",
    "steps",
    "tip",
    "prepMinutes",
    "servings",
    "mealTags",
  ],
  properties: {
    title: { type: "string", minLength: 1, maxLength: 200 },
    ingredients: {
      type: "array",
      minItems: 1,
      maxItems: 60,
      items: { type: "string", minLength: 1, maxLength: 200 },
    },
    steps: {
      type: "array",
      minItems: 1,
      maxItems: 40,
      items: { type: "string", minLength: 1, maxLength: 2000 },
    },
    tip: {
      anyOf: [{ type: "string", maxLength: 500 }, { type: "null" }],
    },
    prepMinutes: { type: "integer", minimum: 1, maximum: 1440 },
    servings: { type: "integer", minimum: 1, maximum: 100 },
    mealTags: {
      type: "array",
      minItems: 1,
      items: {
        type: "string",
        enum: ["breakfast", "lunch", "snack", "dinner"],
      },
    },
  },
} as const;

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

/**
 * Model output is constrained at generation time and validated again before it reaches
 * the editable form. The local reader is retained only as a no-key development floor.
 */
export async function readRecipe(text: string): Promise<AiResult<DraftRecipe>> {
  if (text.length > MAX_PASTED_CHARACTERS) {
    return { ok: false, reason: "too-long" };
  }

  if (!text.trim()) {
    return { ok: false, reason: "unreadable" };
  }

  const key = process.env.OPENAI_API_KEY;

  if (!key) {
    const draft = draftRecipeFromText(text);
    return draft
      ? { ok: true, mode: "local", value: draft }
      : { ok: false, reason: "configuration" };
  }

  let response: Response;

  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_RECIPE_MODEL || DEFAULT_MODEL,
        reasoning: {
          effort: process.env.OPENAI_RECIPE_REASONING || "none",
        },
        store: false,
        max_output_tokens: 4_000,
        instructions: INSTRUCTIONS,
        input: text,
        text: {
          verbosity: "low",
          format: {
            type: "json_schema",
            name: "recipe_draft",
            strict: true,
            schema: OUTPUT_SCHEMA,
          },
        },
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    const timedOut =
      error instanceof DOMException &&
      (error.name === "TimeoutError" || error.name === "AbortError");
    return { ok: false, reason: timedOut ? "timeout" : "unavailable" };
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      return { ok: false, reason: "configuration" };
    }
    return {
      ok: false,
      reason: response.status === 429 ? "busy" : "unavailable",
    };
  }

  let decoded: unknown;

  try {
    const textOutput = outputText(await response.json());
    decoded = textOutput ? JSON.parse(textOutput) : null;
  } catch {
    return { ok: false, reason: "invalid" };
  }

  const draft = draftRecipeSchema.safeParse(decoded);

  if (!draft.success) {
    return { ok: false, reason: "invalid" };
  }

  return { ok: true, mode: "model", value: draft.data };
}
