import { optionalUserId } from "@/lib/supabase/session-user";
import { escapeLikePattern } from "@/lib/text";
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

export async function searchPeople(term: string): Promise<Person[]> {
  const search = term.trim();

  if (search.length < 2) {
    return [];
  }

  const { supabase, userId } = await optionalUserId();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("friend_discoverable", true)
    .ilike("display_name", `%${escapeLikePattern(search)}%`)
    .limit(10);

  if (error) {
    throw new Error(`Could not search: ${error.message}`);
  }

  return data.filter((profile) => profile.id !== userId).map(toPerson);
}
