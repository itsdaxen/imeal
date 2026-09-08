import type { Metadata } from "next";

import { notFound } from "next/navigation";

import { ProfileForm } from "@/features/profile/components/profile-form";
import { DeleteAccountForm } from "@/features/profile/components/delete-account-form";
import { getProfile } from "@/features/profile/profile.queries";
import { PageShell } from "@/components/ui/page-shell";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const profile = await getProfile();

  if (!profile) {
    notFound();
  }

  return (
    <PageShell width="narrow">
      <PageHeader title={<>Profile</>} />

      <ProfileForm profile={profile} />
      <DeleteAccountForm />
    </PageShell>
  );
}
