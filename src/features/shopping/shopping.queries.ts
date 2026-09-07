import { optionalUserId } from "@/lib/supabase/session-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listSchema } from "./shopping.schema";

export type ShoppingItem = {
  createdAt: string;
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  source: "generated" | "manual" | "staple";
  category: string | null;
  checked: boolean;
};

export type ShoppingListSummary = {
  id: string;
  name: string;
  isDefault: boolean;
  isOwn: boolean;
};

export type ShoppingList = {
  listId: string | null;
  listName: string;
  planId: string | null;
  targetListId: string | null;
  items: ShoppingItem[];
  remaining: number;
};

export async function listShoppingLists(): Promise<ShoppingListSummary[]> {
  const { supabase, userId } = await optionalUserId();

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("shopping_lists")
    .select("id, name, is_default, owner_id")
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Could not load your lists: ${error.message}`);
  }

  return data.map((list) => ({
    id: list.id,
    name: list.name,
    isDefault: list.is_default,
    isOwn: list.owner_id === userId,
  }));
}

/** The list a week fills: whatever it points at, or the default. */
export async function resolveWeekList(weekStart: string) {
  const { supabase, userId } = await optionalUserId();

  if (!userId) {
    return { planId: null, listId: null };
  }

  const { data: plan, error: planError } = await supabase
    .from("meal_plans")
    .select("id, target_list_id")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (planError) {
    throw new Error(
      `Could not load the week's shopping destination: ${planError.message}`,
    );
  }

  if (plan?.target_list_id) {
    return { planId: plan.id, listId: plan.target_list_id };
  }

  const { data: fallback, error: fallbackError } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("owner_id", userId)
    .eq("is_default", true)
    .maybeSingle();

  if (fallbackError) {
    throw new Error(
      `Could not load your default shopping list: ${fallbackError.message}`,
    );
  }

  return { planId: plan?.id ?? null, listId: fallback?.id ?? null };
}

export async function getShoppingList(
  weekStart: string,
  requestedListId?: string,
): Promise<ShoppingList> {
  const supabase = await createSupabaseServerClient();
  const { planId, listId: targetListId } = await resolveWeekList(weekStart);
  const selected = listSchema.safeParse({
    listId: requestedListId ?? targetListId,
  });
  const listId = selected.success ? selected.data.listId : null;
  const empty: ShoppingList = {
    listId: null,
    listName: "Shopping",
    planId,
    targetListId,
    items: [],
    remaining: 0,
  };

  if (!listId) {
    return empty;
  }

  const [{ data: list, error: listError }, { data, error }] = await Promise.all(
    [
      supabase
        .from("shopping_lists")
        .select("name")
        .eq("id", listId)
        .maybeSingle(),
      supabase
        .from("shopping_items")
        .select(
          "id, name, quantity, unit, source, category, checked, created_at",
        )
        .eq("list_id", listId)
        .order("checked", { ascending: true })
        .order("created_at", { ascending: false }),
    ],
  );

  if (error || listError) {
    throw new Error(
      `Could not load the shopping list: ${(error ?? listError)?.message}`,
    );
  }

  if (!list) {
    return empty;
  }

  return {
    listId,
    listName: list.name,
    planId,
    targetListId,
    items: data.map(({ created_at, ...item }) => ({
      ...item,
      createdAt: created_at,
    })),
    remaining: data.filter((item) => !item.checked).length,
  };
}

export async function listMembers(listId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("shopping_list_members")
    .select("user_id, profiles (display_name)")
    .eq("list_id", listId);

  if (error) {
    throw new Error(`Could not load who shares this list: ${error.message}`);
  }

  return data.map((row) => ({
    id: row.user_id,
    displayName: row.profiles?.display_name?.trim() || "A cook",
  }));
}

export async function listStaples() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("staples")
    .select("id, name, active")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Could not load staples: ${error.message}`);
  }

  return data;
}
