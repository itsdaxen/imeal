"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUserId } from "@/lib/supabase/session-user";
import { findWeekPlan } from "./week-plan";

const shareSchema = z.object({ weekStart: z.iso.date(), friendId: z.uuid() });
const receivedSchema = z.object({ planId: z.uuid(), weekStart: z.iso.date() });

export async function shareWeek(formData: FormData) {
  const parsed = shareSchema.safeParse({
    weekStart: formData.get("weekStart"),
    friendId: formData.get("friendId"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();
  const plan = await findWeekPlan(supabase, userId, parsed.data.weekStart);

  if (!plan) {
    return;
  }

  // Also shares the private recipes in the week, so it is readable on arrival.
  await supabase.rpc("share_meal_plan", {
    p_meal_plan_id: plan.id,
    p_recipient: parsed.data.friendId,
  });

  revalidatePath("/planner");
}

export async function unshareWeek(formData: FormData) {
  const parsed = shareSchema.safeParse({
    weekStart: formData.get("weekStart"),
    friendId: formData.get("friendId"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();
  const plan = await findWeekPlan(supabase, userId, parsed.data.weekStart);

  if (!plan) {
    return;
  }

  // No share left to remove means it is already not shared — with them, or at all.
  await supabase
    .from("meal_plan_shares")
    .delete()
    .eq("meal_plan_id", plan.id)
    .eq("recipient_id", parsed.data.friendId)
    .eq("owner_id", userId);

  revalidatePath("/planner");
}

export async function copySharedWeek(formData: FormData) {
  const parsed = receivedSchema.safeParse({
    planId: formData.get("planId"),
    weekStart: formData.get("weekStart"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase } = await requireUserId();

  // Copies the recipes too, so the two weeks stop being entangled. The result was
  // thrown away here, so a copy that failed looked exactly like one that worked: the
  // page reloaded on an empty week and said nothing.
  const { error } = await supabase.rpc("copy_shared_plan", {
    p_meal_plan_id: parsed.data.planId,
    p_week_start: parsed.data.weekStart,
  });

  if (error) {
    throw new Error("Could not copy that week. Try again.");
  }

  revalidatePath("/planner");
  redirect(`/planner?week=${parsed.data.weekStart}`);
}

export async function dismissSharedWeek(formData: FormData) {
  const planId = z.uuid().safeParse(formData.get("planId"));

  if (!planId.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();

  // An invitation that is not there has been answered or withdrawn already, which
  // is what dismissing it was for.
  await supabase
    .from("meal_plan_shares")
    .delete()
    .eq("meal_plan_id", planId.data)
    .eq("recipient_id", userId);

  revalidatePath("/planner");
}
