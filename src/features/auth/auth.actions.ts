"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { safeInternalPath } from "@/lib/safe-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "./auth.schema";
import { firstIssue } from "@/lib/form-errors";

export type AuthFormState = {
  error?: string;
  notice?: string;
  /** Echoed back so a sent-link screen can name the address it went to. */
  sentTo?: string;
};

const SIGNED_IN_HOME = "/";

export async function signIn(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error, "Check the form and try again.") };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Supabase already collapses unknown-email and wrong-password into one
    // message; keep it that way so the form cannot confirm an address exists.
    return { error: error.message };
  }

  redirect(
    safeInternalPath(String(formData.get("next") ?? ""), SIGNED_IN_HOME),
  );
}

export async function signUp(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error, "Check the form and try again.") };
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
      data: { display_name: parsed.data.displayName || null },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { notice: "Check your email to confirm your account." };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();

  // The redirect stands whether or not the call reached Supabase: a session that
  // somehow survived is caught the moment they open anything behind requireUserId.
  await supabase.auth.signOut();
  redirect("/sign-in");
}

export async function requestPasswordReset(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error, "Check the form and try again.") };
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const supabase = await createSupabaseServerClient();

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: origin
      ? `${origin}/auth/callback?next=/reset-password`
      : undefined,
  });

  // The same answer either way: telling the sender whether an account exists
  // would turn this form into an account-existence oracle.
  return {
    sentTo: parsed.data.email,
    notice: "If that address has an account, a reset link is on its way.",
  };
}

export async function updatePassword(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmation: formData.get("confirmation"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error, "Check the form and try again.") };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "That reset link has expired. Ask for a new one and try again.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}
