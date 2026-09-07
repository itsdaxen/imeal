import { optionalUserId } from "@/lib/supabase/session-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Person = { id: string; displayName: string };

export type FriendRequest = {
  id: string;
  person: Person;
};

function toPerson(profile: {
  id: string;
  display_name: string | null;
}): Person {
  return {
    id: profile.id,
    displayName: profile.display_name?.trim() || "A cook",
  };
}

export async function listFriends(): Promise<Person[]> {
  const { supabase, userId } = await optionalUserId();

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("friendships")
    .select("friend:profiles!friendships_friend_id_fkey (id, display_name)")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Could not load friends: ${error.message}`);
  }

  return data.map((row) => toPerson(row.friend));
}

export async function listIncomingRequests(): Promise<FriendRequest[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("friend_requests")
    .select(
      "id, requester:profiles!friend_requests_requester_id_fkey (id, display_name)",
    )
    .eq("status", "pending");

  if (error) {
    throw new Error(`Could not load requests: ${error.message}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The select policy returns both directions; incoming are the ones we did not send.
  return data
    .filter((row) => row.requester.id !== user?.id)
    .map((row) => ({ id: row.id, person: toPerson(row.requester) }));
}

export async function listOutgoingRequests(): Promise<FriendRequest[]> {
  const { supabase, userId } = await optionalUserId();

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("friend_requests")
    .select(
      "id, addressee:profiles!friend_requests_addressee_id_fkey (id, display_name)",
    )
    .eq("status", "pending")
    .eq("requester_id", userId);

  if (error) {
    throw new Error(`Could not load sent requests: ${error.message}`);
  }

  return data.map((row) => ({ id: row.id, person: toPerson(row.addressee) }));
}

/**
 * The one person at this address, if they want to be found.
 *
 * By address rather than by name, because a name search made you guess how someone
 * spelled their own, and matched strangers who happened to share it. Exact only: the
 * database function will not answer a partial address, so this cannot be used to walk
 * the list of people who use the app.
 */
export async function findPersonByEmail(email: string): Promise<Person[]> {
  const address = email.trim();

  if (!address) {
    return [];
  }

  const { supabase, userId } = await optionalUserId();

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase.rpc("find_friend_by_email", {
    p_email: address,
  });

  if (error) {
    throw new Error(`Could not search: ${error.message}`);
  }

  return (data ?? []).map(toPerson);
}
