"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { resolveWeekList } from "./shopping.queries";

const weekSchema = z.object({ weekStart: z.iso.date() });

const manualItemSchema = weekSchema.extend({
  name: z.string().trim().min(1, "Name the item.").max(200),
  quantity: z.coerce.number().int().min(1).max(999).default(1),
});

const itemSchema = z.object({ itemId: z.uuid() });

const listNameSchema = z.object({
  name: z.string().trim().min(1, "Name the list.").max(80),
});

const listSchema = z.object({ listId: z.uuid() });
const memberSchema = listSchema.extend({ userId: z.uuid() });

async function requireUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return { supabase, userId: user.id };
}

export async function generateShoppingList(formData: FormData) {
  const parsed = weekSchema.safeParse({ weekStart: formData.get("weekStart") });

  if (!parsed.success) {
    throw new Error("That week is not valid.");
  }

  const { supabase } = await requireUserId();
  const { error } = await supabase.rpc("sync_generated_shopping_items", {
    p_week_start: parsed.data.weekStart,
  });

  if (error) {
    throw new Error(`Could not build the list: ${error.message}`);
  }

  revalidatePath("/shopping");
}

export async function addManualItem(formData: FormData) {
  const parsed = manualItemSchema.safeParse({
    weekStart: formData.get("weekStart"),
    name: formData.get("name"),
    quantity: formData.get("quantity") || 1,
  });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();
  const { listId, planId } = await resolveWeekList(parsed.data.weekStart);

  if (!listId) {
    return;
  }

  await supabase.from("shopping_items").insert({
    user_id: userId,
    list_id: listId,
    meal_plan_id: planId,
    name: parsed.data.name,
    quantity: parsed.data.quantity,
    source: "manual",
  });

  revalidatePath("/shopping");
}

export async function toggleItemChecked(formData: FormData) {
  const parsed = itemSchema.safeParse({ itemId: formData.get("itemId") });

  if (!parsed.success) {
    return;
  }

  const { supabase } = await requireUserId();

  // No owner filter: on a shared list, whoever is in the shop ticks the item off.
  const { data: item } = await supabase
    .from("shopping_items")
    .select("checked")
    .eq("id", parsed.data.itemId)
    .maybeSingle();

  if (!item) {
    return;
  }

  await supabase
    .from("shopping_items")
    .update({ checked: !item.checked })
    .eq("id", parsed.data.itemId);

  revalidatePath("/shopping");
}

export async function removeItem(formData: FormData) {
  const parsed = itemSchema.safeParse({ itemId: formData.get("itemId") });

  if (!parsed.success) {
    return;
  }

  const { supabase } = await requireUserId();
  await supabase.from("shopping_items").delete().eq("id", parsed.data.itemId);

  revalidatePath("/shopping");
}

export async function addStaplesToList(formData: FormData) {
  const parsed = weekSchema.safeParse({ weekStart: formData.get("weekStart") });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();
  const { listId, planId } = await resolveWeekList(parsed.data.weekStart);

  if (!listId) {
    return;
  }

  const { data: staples } = await supabase
    .from("staples")
    .select("name")
    .eq("user_id", userId)
    .eq("active", true);

  if (!staples?.length) {
    return;
  }

  const { data: existing } = await supabase
    .from("shopping_items")
    .select("name")
    .eq("list_id", listId);

  const present = new Set(
    (existing ?? []).map((item) => item.name.toLowerCase()),
  );
  const missing = staples.filter(
    (staple) => !present.has(staple.name.toLowerCase()),
  );

  if (missing.length) {
    await supabase.from("shopping_items").insert(
      missing.map((staple) => ({
        user_id: userId,
        list_id: listId,
        meal_plan_id: planId,
        name: staple.name,
        source: "staple" as const,
      })),
    );
  }

  revalidatePath("/shopping");
}

export async function clearShoppingList(formData: FormData) {
  const parsed = weekSchema.safeParse({ weekStart: formData.get("weekStart") });

  if (!parsed.success) {
    return;
  }

  const { supabase } = await requireUserId();
  const { listId } = await resolveWeekList(parsed.data.weekStart);

  if (!listId) {
    return;
  }

  // Everything goes, including staples and manual items. Rebuilding from the plan
  // is one press away; this exists for the week you want to start over.
  await supabase.from("shopping_items").delete().eq("list_id", listId);

  revalidatePath("/shopping");
}

export async function createShoppingList(formData: FormData) {
  const parsed = listNameSchema.safeParse({ name: formData.get("name") });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();
  const { data: list } = await supabase
    .from("shopping_lists")
    .insert({ owner_id: userId, name: parsed.data.name })
    .select("id")
    .single();

  if (list) {
    // The owner is a member like anyone else, so every policy asks one question.
    await supabase
      .from("shopping_list_members")
      .insert({ list_id: list.id, user_id: userId });
  }

  revalidatePath("/shopping");
}

export async function deleteShoppingList(formData: FormData) {
  const parsed = listSchema.safeParse({ listId: formData.get("listId") });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();

  // The default list is what everything falls back to, so it stays.
  await supabase
    .from("shopping_lists")
    .delete()
    .eq("id", parsed.data.listId)
    .eq("owner_id", userId)
    .eq("is_default", false);

  revalidatePath("/shopping");
}

export async function setWeekList(formData: FormData) {
  const parsed = weekSchema.extend({ listId: z.uuid() }).safeParse({
    weekStart: formData.get("weekStart"),
    listId: formData.get("listId"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();
  await supabase
    .from("meal_plans")
    .update({ target_list_id: parsed.data.listId })
    .eq("user_id", userId)
    .eq("week_start", parsed.data.weekStart);

  revalidatePath("/shopping");
}

export async function addListMember(formData: FormData) {
  const parsed = memberSchema.safeParse({
    listId: formData.get("listId"),
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase } = await requireUserId();
  await supabase
    .from("shopping_list_members")
    .insert({ list_id: parsed.data.listId, user_id: parsed.data.userId });

  revalidatePath("/shopping");
}

export async function removeListMember(formData: FormData) {
  const parsed = memberSchema.safeParse({
    listId: formData.get("listId"),
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase } = await requireUserId();
  await supabase
    .from("shopping_list_members")
    .delete()
    .eq("list_id", parsed.data.listId)
    .eq("user_id", parsed.data.userId);

  revalidatePath("/shopping");
}

export async function addStaple(formData: FormData) {
  const parsed = z
    .object({ name: z.string().trim().min(1, "Name the staple.").max(120) })
    .safeParse({ name: formData.get("name") });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();

  // The unique (user_id, name) makes a repeat submission a no-op rather than an error.
  await supabase
    .from("staples")
    .upsert(
      { user_id: userId, name: parsed.data.name },
      { onConflict: "user_id,name" },
    );

  revalidatePath("/shopping/staples");
}

export async function removeStaple(formData: FormData) {
  const id = z.uuid().safeParse(formData.get("stapleId"));

  if (!id.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();
  await supabase
    .from("staples")
    .delete()
    .eq("id", id.data)
    .eq("user_id", userId);

  revalidatePath("/shopping/staples");
}

export async function toggleStaple(formData: FormData) {
  const id = z.uuid().safeParse(formData.get("stapleId"));

  if (!id.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();
  const { data: staple } = await supabase
    .from("staples")
    .select("active")
    .eq("id", id.data)
    .eq("user_id", userId)
    .maybeSingle();

  if (!staple) {
    return;
  }

  // An inactive staple is remembered but skipped when staples are added to a list.
  await supabase
    .from("staples")
    .update({ active: !staple.active })
    .eq("id", id.data)
    .eq("user_id", userId);

  revalidatePath("/shopping/staples");
}
