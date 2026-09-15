"use server";

import { createHash } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listSchema } from "@/features/shopping/shopping.schema";

import { readRecipe } from "./ai";
import type { DraftRecipe } from "./draft-recipe";
import {
  MAX_PROPOSAL,
  tidyProposalSchema,
  validateTidyProposal,
  type TidyableItem,
  type TidyProposal,
} from "./tidy-list";
import { firstIssue } from "@/lib/form-errors";
import { organizeShoppingList } from "./shopping-organizer";

const pasteSchema = z.object({
  text: z.string().trim().min(1, "Paste a recipe first."),
});

export type RecipeDraftState = { error?: string; draft?: DraftRecipe };
export type TidyState = {
  error?: string;
  proposal?: TidyProposal;
  revision?: string;
};

const MESSAGES = {
  "too-long": "That is longer than we can read. Trim it to the recipe itself.",
  unreadable:
    "No ingredients or steps in there. Check the paste and try again.",
  "nothing-to-do": "The list is empty, so there is nothing to tidy.",
  "too-many-items": "This list is too large to organize in one pass.",
  configuration: "The organizer is not configured correctly.",
  busy: "The organizer is busy right now. Try again in a moment.",
  timeout: "The organizer took too long. Try the list again.",
  unavailable: "The organizer is unavailable right now. Try again shortly.",
  invalid: "The organizer returned an unsafe proposal. Nothing was changed.",
} as const;

const RECIPE_MESSAGES = {
  "too-long": "That is longer than we can read. Trim it to the recipe itself.",
  unreadable:
    "No ingredients or steps in there. Check the paste and try again.",
  "nothing-to-do": "There is no recipe to import.",
  configuration: "Recipe import is not configured correctly.",
  busy: "Recipe import is busy right now. Try again in a moment.",
  timeout: "Reading that recipe took too long. Try again.",
  unavailable: "Recipe import is unavailable right now. Try again shortly.",
  invalid:
    "The recipe could not be read safely. Check the paste and try again.",
} as const;

export async function draftRecipe(
  _previous: RecipeDraftState,
  formData: FormData,
): Promise<RecipeDraftState> {
  const parsed = pasteSchema.safeParse({ text: formData.get("text") });

  if (!parsed.success) {
    return {
      error: firstIssue(parsed.error, "Paste a recipe first."),
    };
  }

  const result = await readRecipe(parsed.data.text);

  if (!result.ok) {
    return { error: RECIPE_MESSAGES[result.reason] };
  }

  return { draft: result.value };
}

async function currentListItems(list: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data, error } = await supabase
    .from("shopping_items")
    .select("id, name, quantity, unit, checked, category")
    .eq("list_id", list)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Could not read the list: ${error.message}`);
  }

  return { supabase, list, items: data satisfies TidyableItem[] };
}

/** Detects edits made while somebody is reviewing a proposal. */
function listRevision(items: ReadonlyArray<TidyableItem>) {
  const snapshot = [...items]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(({ id, name, quantity, unit, checked, category }) => ({
      id,
      name,
      quantity,
      unit,
      checked,
      category,
    }));

  return createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
}

export async function proposeTidy(
  _previous: TidyState,
  formData: FormData,
): Promise<TidyState> {
  const parsed = listSchema.safeParse({ listId: formData.get("listId") });

  if (!parsed.success) {
    return { error: "That list is not valid." };
  }

  const { items } = await currentListItems(parsed.data.listId);
  const result = await organizeShoppingList(items);

  if (!result.ok) {
    return { error: MESSAGES[result.reason] };
  }

  return { proposal: result.value, revision: listRevision(items) };
}

/** Apply the exact proposal the person reviewed, after proving it still covers the
 * current list exactly once. List members can already rename and merge these rows. */
export async function applyTidy(formData: FormData) {
  const parsed = listSchema
    .extend({
      proposal: z.string().min(1).max(MAX_PROPOSAL),
      revision: z.string().length(64),
    })
    .safeParse({
      listId: formData.get("listId"),
      proposal: formData.get("proposal"),
      revision: formData.get("revision"),
    });

  if (!parsed.success) {
    throw new Error("That list is not valid.");
  }

  const { supabase, list, items } = await currentListItems(parsed.data.listId);

  if (listRevision(items) !== parsed.data.revision) {
    throw new Error("The list changed. Organize it again before applying.");
  }
  let decoded: unknown;

  try {
    decoded = JSON.parse(parsed.data.proposal);
  } catch {
    throw new Error("That organization proposal is not valid.");
  }

  const shaped = tidyProposalSchema.safeParse(decoded);
  const proposal = shaped.success
    ? validateTidyProposal(items, shaped.data)
    : null;

  if (!list || !proposal) {
    throw new Error("The list changed. Organize it again before applying.");
  }

  const { error } = await supabase.rpc("apply_shopping_tidy", {
    p_list: list,
    p_changes: proposal.items,
  });

  if (error) {
    throw new Error(`Could not tidy the list: ${error.message}`);
  }

  revalidatePath("/shopping");
}
