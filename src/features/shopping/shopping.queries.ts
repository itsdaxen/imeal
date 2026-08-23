import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ShoppingItem = {
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
  items: ShoppingItem[];
  remaining: number;
};

export async function listShoppingLists(): Promise<ShoppingListSummary[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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
    isOwn: list.owner_id === user.id,
  }));
}

/** The list a week fills: whatever it points at, or the default. */
export async function resolveWeekList(weekStart: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { planId: null, listId: null };
  }

  const { data: plan } = await supabase
    .from("meal_plans")
    .select("id, target_list_id")
    .eq("user_id", user.id)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (plan?.target_list_id) {
    return { planId: plan.id, listId: plan.target_list_id };
  }

  const { data: fallback } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("owner_id", user.id)
    .eq("is_default", true)
    .maybeSingle();

  return { planId: plan?.id ?? null, listId: fallback?.id ?? null };
}

export async function getShoppingList(
  weekStart: string,
): Promise<ShoppingList> {
  const supabase = await createSupabaseServerClient();
  const { planId, listId } = await resolveWeekList(weekStart);

  if (!listId) {
    return {
      listId: null,
      listName: "Shopping",
      planId,
      items: [],
      remaining: 0,
    };
  }

  const [{ data: list }, { data, error }] = await Promise.all([
    supabase
      .from("shopping_lists")
      .select("name")
      .eq("id", listId)
      .maybeSingle(),
    supabase
      .from("shopping_items")
      .select("id, name, quantity, unit, source, category, checked")
      .eq("list_id", listId)
      .order("checked", { ascending: true })
      .order("name", { ascending: true }),
  ]);

  if (error) {
    throw new Error(`Could not load the shopping list: ${error.message}`);
  }

  return {
    listId,
    listName: list?.name ?? "Shopping",
    planId,
    items: data,
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
