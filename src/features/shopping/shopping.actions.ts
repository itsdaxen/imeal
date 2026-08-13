"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const weekSchema = z.object({ weekStart: z.iso.date() });

const manualItemSchema = weekSchema.extend({
  name: z.string().trim().min(1, "Name the item.").max(200),
  quantity: z.coerce.number().int().min(1).max(999).default(1),
});

const itemSchema = z.object({
  itemId: z.uuid(),
  weekStart: z.iso.date(),
});

const stapleSchema = z.object({
  name: z.string().trim().min(1, "Name the staple.").max(120),
});

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

async function findPlanId(weekStart: string) {
  const { supabase, userId } = await requireUserId();
  const { data } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();

  return { supabase, userId, planId: data?.id ?? null };
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

  const { supabase, userId, planId } = await findPlanId(parsed.data.weekStart);

  if (!planId) {
    return;
  }

  await supabase.from("shopping_items").insert({
    user_id: userId,
    meal_plan_id: planId,
    name: parsed.data.name,
    quantity: parsed.data.quantity,
    source: "manual",
  });

  revalidatePath("/shopping");
}

export async function toggleItemChecked(formData: FormData) {
  const parsed = itemSchema.safeParse({
    itemId: formData.get("itemId"),
    weekStart: formData.get("weekStart"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();
  const { data: item } = await supabase
    .from("shopping_items")
    .select("checked")
    .eq("id", parsed.data.itemId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!item) {
    return;
  }

  await supabase
    .from("shopping_items")
    .update({ checked: !item.checked })
    .eq("id", parsed.data.itemId)
    .eq("user_id", userId);

  revalidatePath("/shopping");
}

export async function removeItem(formData: FormData) {
  const parsed = itemSchema.safeParse({
    itemId: formData.get("itemId"),
    weekStart: formData.get("weekStart"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();
  await supabase
    .from("shopping_items")
    .delete()
    .eq("id", parsed.data.itemId)
    .eq("user_id", userId);

  revalidatePath("/shopping");
}

export async function addStaplesToList(formData: FormData) {
  const parsed = weekSchema.safeParse({ weekStart: formData.get("weekStart") });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId, planId } = await findPlanId(parsed.data.weekStart);

  if (!planId) {
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
    .eq("meal_plan_id", planId);

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
        meal_plan_id: planId,
        name: staple.name,
        source: "staple" as const,
      })),
    );
  }

  revalidatePath("/shopping");
}

export async function addStaple(formData: FormData) {
  const parsed = stapleSchema.safeParse({ name: formData.get("name") });

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
