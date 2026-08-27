import type { Metadata } from "next";

import { Link, Typography } from "@heroui/react";

import { SignUpForm } from "@/features/auth/components/sign-up-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <section className="flex flex-col gap-7">
      <div className="space-y-2">
        <Typography type="h1" weight="semibold">
          Create your account
        </Typography>
        <Typography className="text-muted" type="body-sm">
          Keep your recipes, weekly plans, and shopping lists in one calm place.
        </Typography>
      </div>

      <SignUpForm />

      <Typography className="border-t border-separator pt-6" type="body-sm">
        Already have an account? <Link href="/sign-in">Sign in</Link>
      </Typography>
    </section>
  );
}
