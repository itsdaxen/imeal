import type { Metadata } from "next";

import { Link, Typography } from "@heroui/react";

import { SignInForm } from "@/features/auth/components/sign-in-form";
import { safeInternalPath } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <section className="flex flex-col gap-6">
      <Typography type="h1" weight="semibold">
        Welcome back
      </Typography>

      <SignInForm next={safeInternalPath(next, "/")} />

      <Typography type="body-sm">
        Need an account? <Link href="/sign-up">Create one</Link>
      </Typography>
    </section>
  );
}
