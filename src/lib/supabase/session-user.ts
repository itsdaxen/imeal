import "server-only";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "./server";

/**
 * The signed-in user, for a write that has no meaning without one.
 *
 * Every feature's actions opened with this same block. Sharing it is not only less
 * code: it means "a signed-out caller is sent to sign-in" is decided once, so no
 * future action can quietly get that wrong.
 */
export async function requireUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return { supabase, userId: user.id };
}

/**
 * The signed-in user, for a read that can simply come back empty.
 *
 * Queries must not redirect — a page renders them while deciding what to show — so
 * this reports absence instead.
 */
export async function optionalUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, userId: user?.id ?? null };
}
