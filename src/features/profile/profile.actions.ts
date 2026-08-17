"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { parseProfileForm } from "./profile.schema";

export type ProfileFormState = {
  error?: string;
  saved?: boolean;
};

export async function updateProfile(
  _previous: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const parsed = parseProfileForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      friend_discoverable: parsed.data.discoverable,
      default_meals_per_week: parsed.data.defaultMealsPerWeek,
      default_enabled_slots: parsed.data.defaultEnabledSlots,
    })
    .eq("id", user.id);

  if (error) {
    return { error: "Could not save your profile. Try again." };
  }

  revalidatePath("/profile");
  revalidatePath("/", "layout");

  return { saved: true };
}
