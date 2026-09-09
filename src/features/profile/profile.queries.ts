import { optionalUserId } from "@/lib/supabase/session-user";

import type { MealSlot } from "@/features/recipes/recipe.schema";

export type Profile = {
  avatarUrl: string | null;
  displayName: string;
  discoverable: boolean;
  /** The shape of a day: its meal types in order, repeats included. */
  defaultDay: MealSlot[];
};

export async function getProfile(): Promise<Profile | null> {
  const { supabase, userId } = await optionalUserId();

  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "display_name, avatar_url, friend_discoverable, default_enabled_slots",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load your profile: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    avatarUrl: data.avatar_url,
    displayName: data.display_name ?? "",
    discoverable: data.friend_discoverable,
    defaultDay: data.default_enabled_slots,
  };
}
