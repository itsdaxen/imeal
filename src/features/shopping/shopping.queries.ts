import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ShoppingItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  source: "generated" | "manual" | "staple";
  checked: boolean;
};

export type ShoppingList = {
  planId: string | null;
  items: ShoppingItem[];
  remaining: number;
};

export async function getShoppingList(
  weekStart: string,
): Promise<ShoppingList> {
  const supabase = await createSupabaseServerClient();

  const { data: plan, error: planError } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("week_start", weekStart)
    .maybeSingle();

  if (planError) {
    throw new Error(`Could not load the week: ${planError.message}`);
  }

  if (!plan) {
    return { planId: null, items: [], remaining: 0 };
  }

  const { data, error } = await supabase
    .from("shopping_items")
    .select("id, name, quantity, unit, source, checked")
    .eq("meal_plan_id", plan.id)
    .order("checked", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Could not load the shopping list: ${error.message}`);
  }

  return {
    planId: plan.id,
    items: data,
    remaining: data.filter((item) => !item.checked).length,
  };
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
