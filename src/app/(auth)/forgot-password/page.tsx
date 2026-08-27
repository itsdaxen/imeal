import type { Metadata } from "next";

import { Link, Typography } from "@heroui/react";

import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <section className="flex flex-col gap-7">
      <div className="space-y-2">
        <Typography type="h1" weight="semibold">
          Reset your password
        </Typography>
        <Typography className="text-muted" type="body-sm">
          We will email you a secure link to choose a new password.
        </Typography>
      </div>

      <ForgotPasswordForm />

      <Typography className="border-t border-separator pt-6" type="body-sm">
        Remembered it? <Link href="/sign-in">Sign in</Link>
      </Typography>
    </section>
  );
}
