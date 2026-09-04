"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUserId } from "@/lib/supabase/session-user";

const personSchema = z.object({ personId: z.uuid() });
const requestSchema = z.object({ requestId: z.uuid() });

export async function sendFriendRequest(formData: FormData) {
  const parsed = personSchema.safeParse({ personId: formData.get("personId") });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();

  // The unique pending index and the policy's is_friend check make a repeat or an
  // already-friends request fail; neither is worth surfacing as an error.
  await supabase
    .from("friend_requests")
    .insert({ requester_id: userId, addressee_id: parsed.data.personId });

  revalidatePath("/friends");
}

export async function acceptFriendRequest(formData: FormData) {
  const parsed = requestSchema.safeParse({
    requestId: formData.get("requestId"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase } = await requireUserId();
  await supabase.rpc("accept_friend_request", {
    p_request_id: parsed.data.requestId,
  });

  revalidatePath("/friends");
}

export async function declineFriendRequest(formData: FormData) {
  const parsed = requestSchema.safeParse({
    requestId: formData.get("requestId"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase } = await requireUserId();
  await supabase.rpc("decline_friend_request", {
    p_request_id: parsed.data.requestId,
  });

  revalidatePath("/friends");
}

export async function withdrawFriendRequest(formData: FormData) {
  const parsed = requestSchema.safeParse({
    requestId: formData.get("requestId"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();
  await supabase
    .from("friend_requests")
    .delete()
    .eq("id", parsed.data.requestId)
    .eq("requester_id", userId);

  revalidatePath("/friends");
}

export async function removeFriend(formData: FormData) {
  const parsed = personSchema.safeParse({ personId: formData.get("personId") });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();

  // Both mirrored rows go, so the friendship disappears for the other person too.
  await supabase
    .from("friendships")
    .delete()
    .or(
      `and(user_id.eq.${userId},friend_id.eq.${parsed.data.personId}),` +
        `and(user_id.eq.${parsed.data.personId},friend_id.eq.${userId})`,
    );

  revalidatePath("/friends");
}
