import type { Metadata } from "next";

import { notFound } from "next/navigation";
import { Typography } from "@heroui/react";

import { ProfileForm } from "@/features/profile/components/profile-form";
import { getProfile } from "@/features/profile/profile.queries";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const profile = await getProfile();

  if (!profile) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 pt-10 sm:pt-14">
      <header className="flex flex-col gap-2">
        <Typography type="h1" weight="semibold">
          Profile
        </Typography>
        <Typography className="text-muted" type="body-sm">
          How you appear to friends, and the defaults used when planning a week.
        </Typography>
      </header>

      <ProfileForm profile={profile} />
    </main>
  );
}
