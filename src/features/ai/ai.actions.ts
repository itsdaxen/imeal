"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listSchema } from "@/features/shopping/shopping.schema";

import { readRecipe, readTidy } from "./ai";
import type { DraftRecipe } from "./draft-recipe";
import type { TidyableItem, TidyChange } from "./tidy-list";

const pasteSchema = z.object({
  text: z.string().trim().min(1, "Paste a recipe first."),
});

export type RecipeDraftState = { error?: string; draft?: DraftRecipe };
export type TidyState = { error?: string; changes?: TidyChange[] };

const MESSAGES = {
  "too-long": "That is longer than we can read. Trim it to the recipe itself.",
  unreadable:
    "No ingredients or steps in there. Check the paste and try again.",
  "nothing-to-do": "The list is empty, so there is nothing to tidy.",
} as const;

export async function draftRecipe(
  _previous: RecipeDraftState,
  formData: FormData,
): Promise<RecipeDraftState> {
  const parsed = pasteSchema.safeParse({ text: formData.get("text") });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Paste a recipe first.",
    };
  }

  const result = readRecipe(parsed.data.text);

  if (!result.ok) {
    return { error: MESSAGES[result.reason] };
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
    .select("id, name, quantity, checked, category")
    .eq("list_id", list)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Could not read the list: ${error.message}`);
  }

  return { supabase, list, items: data satisfies TidyableItem[] };
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
  const result = readTidy(items);

  if (!result.ok) {
    return { error: MESSAGES[result.reason] };
  }

  return { changes: result.value };
}

/**
 * The proposal is worked out again here rather than taken from the page, so what gets
 * applied is always derived from the list as it stands and cannot be dictated by the
 * form that was submitted.
 */
export async function applyTidy(formData: FormData) {
  const parsed = listSchema.safeParse({ listId: formData.get("listId") });

  if (!parsed.success) {
    throw new Error("That list is not valid.");
  }

  const { supabase, list, items } = await currentListItems(parsed.data.listId);
  const result = readTidy(items);

  if (!list || !result.ok) {
    return;
  }

  const { error } = await supabase.rpc("apply_shopping_tidy", {
    p_list: list,
    p_changes: result.value,
  });

  if (error) {
    throw new Error(`Could not tidy the list: ${error.message}`);
  }

  revalidatePath("/shopping");
}
