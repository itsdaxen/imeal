// Shared plumbing for the verify-* scripts: everything that is about *running* a
// check rather than about what is being checked.
//
// Supabase's cookie format is the most fragile thing in this directory, so it lives
// in exactly one place. A verifier that encodes its own session can pass for the
// wrong reason — agreeing with itself rather than with the app.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline/promises";

import { createClient } from "@supabase/supabase-js";

export const base = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const service = process.env.SUPABASE_SERVICE_KEY;

assert(url && key && service, "Missing Supabase environment variables.");

// A verifier is not a browser: refreshing tokens or writing a session to disk would
// leak state between runs.
const options = { auth: { autoRefreshToken: false, persistSession: false } };

export const admin = createClient(url, service, options);

/** Unwraps a Supabase response, turning its error channel into a thrown one. */
export async function result(request) {
  const { data, error } = await request;

  if (error) throw new Error(error.message);

  return data;
}

let checks = 0;

export function pass(label) {
  checks += 1;
  console.log(`PASS ${label}`);
}

/** The closing tally, so a run that ends early is obvious rather than merely quiet. */
export function summary(noun) {
  console.log(`\n${checks}/${checks} ${noun}.`);
}

// Supabase splits a session cookie once it passes this many characters.
const CHUNK = 3180;

/** The `cookie` header a signed-in browser would send for this session. */
export function sessionCookie(session) {
  const encoded =
    "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url");
  const prefix = `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;

  if (encoded.length <= CHUNK) {
    return `${prefix}=${encoded}`;
  }

  return Array.from(
    { length: Math.ceil(encoded.length / CHUNK) },
    (_, index) =>
      `${prefix}.${index}=${encoded.slice(index * CHUNK, (index + 1) * CHUNK)}`,
  ).join("; ");
}

const created = [];

/**
 * A throwaway signed-in account.
 *
 * Every id is remembered so `cleanUp` can remove them all, including after a failed
 * assertion — a verifier that leaves accounts behind poisons the next run.
 */
export async function account({ label, name, onboarded = true }) {
  const email = `${label}-${randomUUID()}@example.test`;
  const password = `${name.replace(/\s+/g, "-")}-123!`;
  const { user } = await result(
    admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: name },
    }),
  );

  created.push(user.id);

  // Signing up now lands in first-run setup, and every app route redirects there until
  // it is done. A verifier is almost never asking about a cook's first five minutes,
  // so accounts arrive past it unless a script says otherwise.
  if (onboarded) {
    await result(
      admin
        .from("profiles")
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq("id", user.id),
    );
  }

  const client = createClient(url, key, options);
  const { session } = await result(
    client.auth.signInWithPassword({ email, password }),
  );

  return {
    client,
    cookie: sessionCookie(session),
    email,
    id: user.id,
    password,
    session,
  };
}

/**
 * Removes every account this run made, newest first.
 *
 * Newest first because a later account is often the one referring to an earlier one,
 * and `before` exists for the rows a cascade does not reach.
 */
export async function cleanUp(message, before) {
  for (const id of created.splice(0).reverse()) {
    if (before) await before(id);
    await admin.auth.admin.deleteUser(id);
  }

  console.log(message);
}

/** Holds the fixture open so a person can look at it, when `--browser` is passed. */
export async function holdForReview(lines) {
  if (!process.argv.includes("--browser")) {
    return;
  }

  lines.forEach((line) => console.log(line));

  const terminal = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  await terminal.question("Press Enter when browser review is complete: ");
  terminal.close();
}
