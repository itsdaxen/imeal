import type { Metadata } from "next";

import { Link, Typography } from "@heroui/react";

import { SignUpForm } from "@/features/auth/components/sign-up-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <section className="flex flex-col gap-6">
      <Typography type="h1" weight="semibold">
        Create your account
      </Typography>

      <SignUpForm />

      <Typography type="body-sm">
        Already have an account? <Link href="/sign-in">Sign in</Link>
      </Typography>
    </section>
  );
}
