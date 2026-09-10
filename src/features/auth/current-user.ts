import { createSupabaseServerClient } from "@/lib/supabase/server";
import { initialsOf } from "@/lib/text";

export type CurrentUser = {
  avatarUrl: string | null;
  id: string;
  displayName: string;
  initials: string;
  onboardingComplete: boolean;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, onboarding_completed_at")
    .eq("id", user.id)
    .single();

  // A confirmed account always has an email; the profile name is optional.
  const displayName =
    profile?.display_name?.trim() || (user.email?.split("@")[0] ?? "Cook");

  return {
    avatarUrl: profile?.avatar_url ?? null,
    id: user.id,
    displayName,
    initials: initialsOf(displayName),
    onboardingComplete: Boolean(profile?.onboarding_completed_at),
  };
}
