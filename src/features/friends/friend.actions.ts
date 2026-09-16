"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUserId } from "@/lib/supabase/session-user";

const personSchema = z.object({ personId: z.uuid() });
const requestSchema = z.object({ requestId: z.uuid() });

/**
 * The waiting count is drawn by the layout, and a layout is not re-rendered by
 * revalidating one of its pages — so the badge would keep yesterday's number until a
 * full load. Revalidating the layout costs one extra render and keeps it honest.
 */
function revalidateFriends() {
  revalidatePath("/friends");
  revalidatePath("/friends/invites");
  revalidatePath("/", "layout");
}

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

  revalidateFriends();
}

export async function acceptFriendRequest(formData: FormData) {
  const parsed = requestSchema.safeParse({
    requestId: formData.get("requestId"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase } = await requireUserId();
  const { error } = await supabase.rpc("accept_friend_request", {
    p_request_id: parsed.data.requestId,
  });

  if (error) {
    throw new Error("Could not accept that request. Try again.");
  }

  revalidateFriends();
}

export async function declineFriendRequest(formData: FormData) {
  const parsed = requestSchema.safeParse({
    requestId: formData.get("requestId"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase } = await requireUserId();
  const { error } = await supabase.rpc("decline_friend_request", {
    p_request_id: parsed.data.requestId,
  });

  if (error) {
    throw new Error("Could not decline that request. Try again.");
  }

  revalidateFriends();
}

export async function withdrawFriendRequest(formData: FormData) {
  const parsed = requestSchema.safeParse({
    requestId: formData.get("requestId"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase, userId } = await requireUserId();

  // Deleting nothing is the outcome either way: a request that is not there is a
  // request already withdrawn, or one the other person has just answered.
  await supabase
    .from("friend_requests")
    .delete()
    .eq("id", parsed.data.requestId)
    .eq("requester_id", userId);

  revalidateFriends();
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

  revalidateFriends();
}
