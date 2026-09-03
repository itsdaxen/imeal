// A week shared with you is readable under RLS, so any lookup of "the plan for this
// week" that filters on the date alone matches two rows and fails. This reproduces
// that: two people, one shared week, then the planner must still load.
// Run with: node --env-file=.env.local scripts/verify-shared-week.mjs
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const service = process.env.SUPABASE_SERVICE_KEY;
assert(url && key && service, "Missing Supabase environment variables.");

const base = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";
const options = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(url, service, options);
let checks = 0;
const pass = (label) => {
  checks++;
  console.log(`PASS ${label}`);
};

function mondayOf(date = new Date()) {
  const day = date.getDay() || 7;
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - day + 1);
  return [
    monday.getFullYear(),
    String(monday.getMonth() + 1).padStart(2, "0"),
    String(monday.getDate()).padStart(2, "0"),
  ].join("-");
}

async function account(label) {
  const email = `shared-week-${label}-${randomUUID()}@example.test`;
  const password = "Shared-Week-Probe-123!";
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: `${label}Probe` },
  });
  if (error) throw new Error(error.message);

  const client = createClient(url, key, options);
  const { data: signed } = await client.auth.signInWithPassword({
    email,
    password,
  });
  const encoded =
    "base64-" +
    Buffer.from(JSON.stringify(signed.session)).toString("base64url");
  const prefix = `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
  const cookie = Array.from(
    { length: Math.ceil(encoded.length / 3180) },
    (_, index) =>
      `${prefix}${encoded.length > 3180 ? `.${index}` : ""}=${encoded.slice(index * 3180, (index + 1) * 3180)}`,
  ).join("; ");

  return { client, cookie, id: data.user.id };
}

const owner = await account("owner");
const buddy = await account("buddy");

try {
  const weekStart = mondayOf();

  const { data: theirs } = await admin
    .from("meal_plans")
    .insert({ user_id: owner.id, week_start: weekStart })
    .select("id")
    .single();
  const { data: mine } = await admin
    .from("meal_plans")
    .insert({ user_id: buddy.id, week_start: weekStart })
    .select("id")
    .single();
  assert(theirs.id !== mine.id);

  // Share the owner's week with buddy: now buddy can read two plans for this date.
  const { error: shareError } = await admin.from("meal_plan_shares").insert({
    meal_plan_id: theirs.id,
    owner_id: owner.id,
    recipient_id: buddy.id,
  });
  assert.equal(shareError, null);

  const visible = await buddy.client
    .from("meal_plans")
    .select("id")
    .eq("week_start", weekStart);
  assert.equal(visible.data.length, 2);
  pass("a shared week makes two plans readable for the same date");

  const page = await fetch(`${base}/planner?week=${weekStart}`, {
    headers: { cookie: buddy.cookie },
  });
  const html = await page.text();
  assert.equal(page.status, 200);
  assert.equal(
    /Could not load the week|multiple \(or no\) rows/.test(html),
    false,
    "planner still failed to load the week",
  );
  pass("the planner loads the recipient's own week regardless");

  console.log(`\n${checks}/${checks} shared week checks passed.`);
} finally {
  await admin.auth.admin.deleteUser(owner.id);
  await admin.auth.admin.deleteUser(buddy.id);
  console.log("Disposable shared-week accounts and their data removed.");
}
