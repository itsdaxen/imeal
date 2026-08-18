import type { Metadata } from "next";

import { Typography } from "@heroui/react";

import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = { title: "Set a new password" };

export default function ResetPasswordPage() {
  return (
    <section className="flex flex-col gap-6">
      <Typography type="h1" weight="semibold">
        Set a new password
      </Typography>

      <ResetPasswordForm />
    </section>
  );
}
