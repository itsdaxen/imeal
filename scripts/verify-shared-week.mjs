// A week shared with you is readable under RLS, so any lookup of "the plan for this
// week" that filters on the date alone matches two rows and fails. This reproduces
// that: two people, one shared week, then the planner must still load.
// Run with: node --env-file=.env.local scripts/verify-shared-week.mjs
import assert from "node:assert/strict";

import {
  account,
  admin,
  base,
  cleanUp,
  pass,
  summary,
} from "./lib/harness.mjs";

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

const owner = await account({
  label: "shared-week-owner",
  name: "ownerProbe",
});
const buddy = await account({
  label: "shared-week-buddy",
  name: "buddyProbe",
});

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

  summary("shared week checks passed");
} finally {
  await cleanUp("Disposable shared-week accounts and their data removed.");
}
