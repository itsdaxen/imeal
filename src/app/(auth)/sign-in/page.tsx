import type { Metadata } from "next";

import { Link, Typography } from "@heroui/react";

import { SignInForm } from "@/features/auth/components/sign-in-form";
import { FormMessage } from "@/features/auth/components/form-message";
import { safeInternalPath } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ accountDeleted?: string; next?: string }>;
}) {
  const { accountDeleted, next } = await searchParams;

  return (
    <section className="flex flex-col gap-7">
      <div className="space-y-2">
        <Typography type="h1" weight="semibold">
          Welcome back
        </Typography>
        <Typography className="text-muted" type="body-sm">
          Pick up your plan, recipes, and shopping list where you left them.
        </Typography>
      </div>

      {accountDeleted === "1" ? (
        <FormMessage tone="notice">
          Your account and personal data have been deleted.
        </FormMessage>
      ) : null}

      <SignInForm next={safeInternalPath(next, "/")} />

      <div className="flex flex-col gap-3 border-t border-separator pt-6 text-sm">
        <Typography type="body-sm">
          Need an account? <Link href="/sign-up">Create one</Link>
        </Typography>
        <Typography type="body-sm">
          Forgotten your password? <Link href="/forgot-password">Reset it</Link>
        </Typography>
      </div>
    </section>
  );
}
