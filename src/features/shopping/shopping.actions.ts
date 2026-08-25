"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { resolveWeekList } from "./shopping.queries";
import { listSchema } from "./shopping.schema";

const weekSchema = z.object({ weekStart: z.iso.date() });

const manualItemSchema = listSchema.extend({
  name: z.string().trim().min(1, "Name the item.").max(200),
  quantity: z.coerce.number().int().min(1).max(999).default(1),
});

const itemSchema = z.object({ itemId: z.uuid() });

const listNameSchema = z.object({
  name: z.string().trim().min(1, "Name the list.").max(80),
});

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
  const parsed = weekSchema.extend(listSchema.shape).safeParse({
    weekStart: formData.get("weekStart"),
    listId: formData.get("listId"),
  });

  if (!parsed.success) {
    throw new Error("That week is not valid.");
  }

  const { supabase } = await requireUserId();
  const { listId, planId } = await resolveWeekList(parsed.data.weekStart);

  if (!planId || listId !== parsed.data.listId) {
    throw new Error(
      "The plan's destination changed. Refresh before building the list.",
    );
  }

  const { error } = await supabase.rpc("sync_generated_shopping_items", {
    p_week_start: parsed.data.weekStart,
  });

  if (error) {
    throw new Error(`Could not build the list: ${error.message}`);
  }

  revalidatePath("/shopping");
  redirect(`/shopping?week=${parsed.data.weekStart}&list=${listId}`);
}

export async function addManualItem(formData: FormData) {
  const parsed = manualItemSchema.safeParse({
    listId: formData.get("listId"),
    name: formData.get("name"),
    quantity: formData.get("quantity") || 1,
  });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();
  const { error } = await supabase.from("shopping_items").insert({
    user_id: userId,
    list_id: parsed.data.listId,
    name: parsed.data.name,
    quantity: parsed.data.quantity,
    source: "manual",
  });

  if (error) {
    throw new Error(
      "Could not add the item. Check that you still have access to this list.",
    );
  }

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
  const parsed = listSchema.safeParse({ listId: formData.get("listId") });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();
  const { listId } = parsed.data;

  const { data: staples, error: staplesError } = await supabase
    .from("staples")
    .select("name")
    .eq("user_id", userId)
    .eq("active", true);

  if (staplesError) {
    throw new Error("Could not load your staples.");
  }

  if (!staples?.length) {
    return;
  }

  const { data: existing, error: existingError } = await supabase
    .from("shopping_items")
    .select("name")
    .eq("list_id", listId);

  if (existingError) {
    throw new Error("Could not load this list's items.");
  }

  const present = new Set(
    (existing ?? []).map((item) => item.name.toLowerCase()),
  );
  const missing = staples.filter(
    (staple) => !present.has(staple.name.toLowerCase()),
  );

  if (missing.length) {
    const { error } = await supabase.from("shopping_items").insert(
      missing.map((staple) => ({
        user_id: userId,
        list_id: listId,
        name: staple.name,
        source: "staple" as const,
      })),
    );

    if (error) {
      throw new Error(
        "Could not add staples. Check that you still have access to this list.",
      );
    }
  }

  revalidatePath("/shopping");
}

export async function clearShoppingList(formData: FormData) {
  const parsed = listSchema.safeParse({ listId: formData.get("listId") });

  if (!parsed.success) {
    return;
  }

  const { supabase } = await requireUserId();
  // Everything goes, including staples and manual items. Rebuilding from the plan is
  // one press away; this exists for the week you want to start over.
  const { error } = await supabase
    .from("shopping_items")
    .delete()
    .eq("list_id", parsed.data.listId);

  if (error) {
    throw new Error("Could not clear this list.");
  }

  revalidatePath("/shopping");
}

export async function createShoppingList(formData: FormData) {
  const parsed = listNameSchema.safeParse({ name: formData.get("name") });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();
  const { data: list, error } = await supabase
    .from("shopping_lists")
    .insert({ owner_id: userId, name: parsed.data.name })
    .select("id")
    .single();

  if (error || !list) {
    throw new Error("Could not create the list.");
  }

  const { error: memberError } = await supabase
    .from("shopping_list_members")
    .insert({ list_id: list.id, user_id: userId });

  if (memberError) {
    throw new Error(
      "The list was created, but membership could not be set up.",
    );
  }

  revalidatePath("/shopping");
  redirect(`/shopping?list=${list.id}`);
}

export async function deleteShoppingList(formData: FormData) {
  const parsed = listSchema.safeParse({ listId: formData.get("listId") });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();

  // The default list is what everything falls back to, so it stays.
  const { error } = await supabase
    .from("shopping_lists")
    .delete()
    .eq("id", parsed.data.listId)
    .eq("owner_id", userId)
    .eq("is_default", false);

  if (error) {
    throw new Error("Could not delete the list.");
  }

  revalidatePath("/shopping");
  redirect("/shopping");
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
  const { data: list, error: listError } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("id", parsed.data.listId)
    .maybeSingle();

  if (listError || !list) {
    throw new Error("This shopping list is no longer available.");
  }

  const { data: plan, error } = await supabase
    .from("meal_plans")
    .update({ target_list_id: parsed.data.listId })
    .eq("user_id", userId)
    .eq("week_start", parsed.data.weekStart)
    .select("id")
    .maybeSingle();

  if (error || !plan) {
    throw new Error(
      "Could not change the destination. Check that this week has a plan.",
    );
  }

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
