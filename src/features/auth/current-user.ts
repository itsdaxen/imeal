import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  displayName: string;
  initials: string;
};

function toInitials(displayName: string) {
  const parts = displayName.split(/\s+/).filter(Boolean).slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

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
    .select("display_name")
    .eq("id", user.id)
    .single();

  // A confirmed account always has an email; the profile name is optional.
  const displayName =
    profile?.display_name?.trim() || (user.email?.split("@")[0] ?? "Cook");

  return { id: user.id, displayName, initials: toInitials(displayName) };
}
