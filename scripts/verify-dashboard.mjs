// Verifies that the home screen tells draft, ready, and shopping states apart.
// Run with: node --env-file=.env.local scripts/verify-dashboard.mjs
// Add --browser to keep the fixture until Enter is pressed for visual review.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { createClient } from "@supabase/supabase-js";
import { JSDOM } from "jsdom";

const base = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const service = process.env.SUPABASE_SERVICE_KEY;
assert(url && key && service, "Missing Supabase environment variables.");

const options = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(url, service, options);
const email = `dashboard-${randomUUID()}@example.test`;
const password = "Dashboard-Probe-123!";
let userId;

async function result(request) {
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return data;
}

function currentWeek() {
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - day + 1);
  return {
    dayIndex: day - 1,
    weekStart: [
      monday.getFullYear(),
      String(monday.getMonth() + 1).padStart(2, "0"),
      String(monday.getDate()).padStart(2, "0"),
    ].join("-"),
  };
}

try {
  const { user } = await result(
    admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: "Dashboard Probe" },
    }),
  );
  userId = user.id;
  const client = createClient(url, key, options);
  const { session } = await result(
    client.auth.signInWithPassword({ email, password }),
  );
  const recipes = await result(
    client
      .from("recipes")
      .insert([
        {
          owner_id: user.id,
          title: "Draft breakfast",
          ingredients: ["Oats"],
          steps: ["Cook gently."],
          prep_minutes: 10,
          servings: 1,
          meal_tags: ["breakfast"],
        },
        {
          owner_id: user.id,
          title: "Ready dinner",
          ingredients: ["Beans"],
          steps: ["Simmer."],
          prep_minutes: 30,
          servings: 2,
          meal_tags: ["dinner"],
        },
      ])
      .select("id, title"),
  );
  const { dayIndex, weekStart } = currentWeek();
  const plan = await result(
    client
      .from("meal_plans")
      .insert({
        user_id: user.id,
        week_start: weekStart,
        enabled_slots: ["breakfast", "dinner"],
      })
      .select("id")
      .single(),
  );
  const draft = recipes.find((recipe) => recipe.title === "Draft breakfast");
  const ready = recipes.find((recipe) => recipe.title === "Ready dinner");
  assert(draft && ready);
  await result(
    client.from("meal_plan_items").insert([
      {
        meal_plan_id: plan.id,
        recipe_id: draft.id,
        day_index: dayIndex,
        slot: "breakfast",
        approved: false,
      },
      {
        meal_plan_id: plan.id,
        recipe_id: ready.id,
        day_index: dayIndex,
        slot: "dinner",
        approved: true,
      },
    ]),
  );
  const encoded =
    "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url");
  const prefix = `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
  const cookie = Array.from(
    { length: Math.ceil(encoded.length / 3180) },
    (_, index) =>
      `${prefix}${encoded.length > 3180 ? `.${index}` : ""}=${encoded.slice(index * 3180, (index + 1) * 3180)}`,
  ).join("; ");
  const response = await fetch(base, { headers: { cookie } });
  const document = new JSDOM(await response.text()).window.document;
  const text = document.body.textContent;
  assert.equal(response.status, 200);
  assert.match(text, /1 approved · 1 to review/);
  assert.match(text, /Draft breakfast/);
  assert.match(text, /awaiting approval/);
  assert.match(text, /DraftReview/);
  assert.match(text, /Ready dinner/);
  assert.match(text, /ReadyCook/);
  assert.match(text, /Your shopping list is empty/);
  console.log(
    "PASS dashboard distinguishes proposals, ready meals, and an empty list",
  );

  if (process.argv.includes("--browser")) {
    console.log(`Browser fixture: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Dashboard URL: ${base}`);
    const terminal = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    await terminal.question("Press Enter when browser review is complete: ");
    terminal.close();
  }
} finally {
  if (userId) {
    await result(admin.from("meal_plans").delete().eq("user_id", userId));
    await result(admin.auth.admin.deleteUser(userId));
  }
  console.log("Disposable dashboard account and its data removed.");
}
