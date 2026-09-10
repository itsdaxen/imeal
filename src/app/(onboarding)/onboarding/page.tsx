import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/current-user";
import { DEFAULT_DAY } from "@/features/planner/day-shape";
import { OnboardingForm } from "@/features/onboarding/components/onboarding-form";
import { getProfile } from "@/features/profile/profile.queries";

export const metadata: Metadata = { title: "Welcome" };

export default async function OnboardingPage() {
  const [user, profile] = await Promise.all([getCurrentUser(), getProfile()]);

  if (!user || !profile) redirect("/sign-in?next=/onboarding");
  // The route remains directly previewable while designing and auditing it locally.
  // Production keeps onboarding as a first-run screen rather than a settings alias.
  if (user.onboardingComplete && process.env.NODE_ENV !== "development") {
    redirect("/");
  }

  return (
    <OnboardingForm
      day={profile.defaultDay.length > 0 ? profile.defaultDay : DEFAULT_DAY}
      displayName={profile.displayName || user.displayName}
    />
  );
}
