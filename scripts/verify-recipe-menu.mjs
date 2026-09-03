// The recipe menu is now the only route to sharing and to the catalog, so a break
// here makes both unreachable without any page failing to render.
// Run with: node --env-file=.env.local scripts/verify-recipe-menu.mjs
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

function pass(label) {
  checks++;
  console.log(`PASS ${label}`);
}

async function account(label) {
  const email = `recipe-menu-${label}-${randomUUID()}@example.test`;
  const password = "Recipe-Menu-Probe-123!";
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
  const { error: friendError } = await admin.from("friendships").insert([
    { user_id: owner.id, friend_id: buddy.id },
    { user_id: buddy.id, friend_id: owner.id },
  ]);
  assert.equal(friendError, null);

  const { data: recipe } = await admin
    .from("recipes")
    .insert({
      owner_id: owner.id,
      title: "Menu Share Target",
      ingredients: ["X"],
      steps: ["Y"],
      prep_minutes: 10,
      servings: 1,
      meal_tags: ["dinner"],
    })
    .select("id")
    .single();

  const get = async (path, cookie) =>
    (await fetch(base + path, { headers: { cookie } })).text();

  const detail = await get(`/recipes/${recipe.id}`, owner.cookie);
  assert.match(detail, /Recipe options/);
  pass("the owner menu is on the recipe");
  assert.match(detail, /buddyProbe/);
  pass("the friend list reaches the share dialog");

  await admin.from("recipe_shares").insert({
    recipe_id: recipe.id,
    shared_with: buddy.id,
    shared_by: owner.id,
  });
  const shared = await get("/recipes/shared", buddy.cookie);
  assert.match(shared, /Menu Share Target/);
  pass("a shared recipe reaches the recipient");

  const { error: suggestError } = await owner.client
    .from("recipe_suggestions")
    .insert({ recipe_id: recipe.id, suggested_by: owner.id });
  assert.equal(suggestError, null);

  const pending = await get(`/recipes/${recipe.id}`, owner.cookie);
  assert.match(pending, /Catalog review pending/);
  pass("a pending suggestion still shows its status on the recipe");

  await admin.from("recipes").delete().eq("id", recipe.id);
  console.log(`\n${checks}/${checks} recipe menu checks passed.`);
} finally {
  await admin.auth.admin.deleteUser(owner.id);
  await admin.auth.admin.deleteUser(buddy.id);
  console.log("Disposable recipe-menu accounts and their data removed.");
}
