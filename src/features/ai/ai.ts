import {
  draftRecipeFromText,
  MAX_PASTED_CHARACTERS,
  type DraftRecipe,
} from "./draft-recipe";
import { tidyList, type TidyableItem, type TidyChange } from "./tidy-list";

export type AiMode = "local" | "model";

export type AiResult<T> =
  | { ok: true; mode: AiMode; value: T }
  | { ok: false; reason: "too-long" | "unreadable" | "nothing-to-do" };

/**
 * Every assisted feature goes through here, so wiring a real model later is one file
 * rather than a change to each screen. Until then the same work is done locally, which
 * keeps the product whole for anyone running it without a key.
 */
export function readRecipe(text: string): AiResult<DraftRecipe> {
  if (text.length > MAX_PASTED_CHARACTERS) {
    return { ok: false, reason: "too-long" };
  }

  const draft = draftRecipeFromText(text);

  if (!draft) {
    return { ok: false, reason: "unreadable" };
  }

  return { ok: true, mode: "local", value: draft };
}

export function readTidy(
  items: ReadonlyArray<TidyableItem>,
): AiResult<TidyChange[]> {
  if (items.length === 0) {
    return { ok: false, reason: "nothing-to-do" };
  }

  return { ok: true, mode: "local", value: tidyList(items) };
}
