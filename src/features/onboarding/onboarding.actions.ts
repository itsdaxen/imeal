"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildDay, DEFAULT_DAY } from "@/features/planner/day-shape";
import { applyDefaultDay } from "@/features/planner/week-plan";
import { parseProfileForm } from "@/features/profile/profile.schema";
import { parseStapleNames } from "@/features/shopping/shopping.schema";
import { firstIssue } from "@/lib/form-errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type OnboardingState = { error?: string };

export async function completeOnboarding(
  _previous: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const parsed = parseProfileForm(formData);

  if (!parsed.success) {
    return { error: firstIssue(parsed.error, "Check your choices.") };
  }

  const staples = parseStapleNames(formData.get("staples"));

  if (!staples.success) {
    return { error: firstIssue(staples.error, "Check your staples.") };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in?next=/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("default_enabled_slots")
    .eq("id", user.id)
    .single();
  const day = buildDay(
    parsed.data.defaultMealTypes,
    parsed.data.defaultMealsPerDay,
  );

  if (staples.data.length > 0) {
    const { error: staplesError } = await supabase.from("staples").upsert(
      staples.data.map((name) => ({ name, user_id: user.id })),
      { onConflict: "user_id,name" },
    );

    if (staplesError) {
      return { error: "Could not save your staples. Try again." };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      default_enabled_slots: day,
      display_name: parsed.data.displayName,
      friend_discoverable: parsed.data.discoverable,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: "Could not finish setup. Try again." };
  }

  await applyDefaultDay(
    supabase,
    user.id,
    profile?.default_enabled_slots ?? DEFAULT_DAY,
    day,
  );

  revalidatePath("/", "layout");
  redirect("/");
}
