import type { Metadata } from "next";

import { notFound } from "next/navigation";
import { Typography } from "@heroui/react";

import { ProfileForm } from "@/features/profile/components/profile-form";
import { DeleteAccountForm } from "@/features/profile/components/delete-account-form";
import { getProfile } from "@/features/profile/profile.queries";
import { PageShell } from "@/components/ui/page-shell";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const profile = await getProfile();

  if (!profile) {
    notFound();
  }

  return (
    <PageShell width="narrow">
      <header className="flex flex-col gap-2">
        <Typography type="h1" weight="semibold">
          Profile
        </Typography>
        <Typography className="text-muted" type="body-sm">
          How you appear to friends, and the defaults used when planning a week.
        </Typography>
      </header>

      <ProfileForm profile={profile} />
      <DeleteAccountForm />
    </PageShell>
  );
}
