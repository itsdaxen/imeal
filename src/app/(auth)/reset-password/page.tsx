import type { Metadata } from "next";

import { Typography } from "@heroui/react";

import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = { title: "Set a new password" };

export default function ResetPasswordPage() {
  return (
    <section className="flex flex-col gap-7">
      <div className="space-y-2">
        <Typography type="h1" weight="semibold">
          Set a new password
        </Typography>
        <Typography className="text-muted" type="body-sm">
          Choose something memorable that you do not use elsewhere.
        </Typography>
      </div>

      <ResetPasswordForm />
    </section>
  );
}
