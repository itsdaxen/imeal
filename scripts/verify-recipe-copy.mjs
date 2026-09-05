// Exercises the real shared-recipe copy form with disposable users.
// Run with: node --env-file=.env.local scripts/verify-recipe-copy.mjs
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
const users = [];
let checks = 0;

async function result(request) {
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return data;
}

function pass(label) {
  checks++;
  console.log(`PASS ${label}`);
}

async function account(label) {
  const email = `recipe-copy-${label}-${randomUUID()}@example.test`;
  const password = "Recipe-Copy-Probe-123!";
  const { user } = await result(
    admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: `${label} Probe` },
    }),
  );
  users.push(user.id);
  const client = createClient(url, key, options);
  const { session } = await result(
    client.auth.signInWithPassword({ email, password }),
  );
  const encoded =
    "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url");
  const prefix = `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
  const cookie = Array.from(
    { length: Math.ceil(encoded.length / 3180) },
    (_, index) =>
      `${prefix}${encoded.length > 3180 ? `.${index}` : ""}=${encoded.slice(index * 3180, (index + 1) * 3180)}`,
  ).join("; ");
  return { client, cookie, email, id: user.id, password };
}

async function sharedPage(account) {
  const response = await fetch(`${base}/recipes/shared`, {
    headers: { cookie: account.cookie },
  });
  assert.equal(response.status, 200);
  return new JSDOM(await response.text()).window.document;
}

function copyForm(document) {
  const form = [...document.forms].find((candidate) =>
    [...candidate.querySelectorAll("button")].some(
      (button) => button.textContent.trim() === "Save a copy",
    ),
  );
  assert(form, "Expected the shared recipe copy form");
  return form;
}

async function submit(account, form) {
  const data = new FormData();
  for (const input of form.querySelectorAll("input[name]")) {
    data.set(input.name, input.value);
  }
  assert(
    [...data.keys()].some((name) => name.startsWith("$ACTION_")),
    "Server action is wired",
  );
  const response = await fetch(`${base}/recipes/shared`, {
    method: "POST",
    body: data,
    redirect: "manual",
    headers: { cookie: account.cookie, origin: new URL(base).origin },
  });
  await response.text();
  assert(response.status < 400, `Copy form returned ${response.status}`);
}

try {
  await fetch(`${base}/sign-in`);
  const owner = await account("Owner");
  const recipient = await account("Recipient");
  const outsider = await account("Outsider");
  await result(
    admin.from("friendships").insert([
      { user_id: owner.id, friend_id: recipient.id },
      { user_id: recipient.id, friend_id: owner.id },
    ]),
  );
  const source = await result(
    owner.client
      .from("recipes")
      .insert({
        owner_id: owner.id,
        title: "Friend's tomato soup",
        ingredients: ["Tomatoes", "Stock"],
        steps: ["Simmer until rich."],
        tip: "Finish with olive oil.",
        prep_minutes: 25,
        servings: 3,
        meal_tags: ["lunch", "dinner"],
        collection_tags: ["Comfort food"],
        image_url: "/favicon.ico",
      })
      .select("id")
      .single(),
  );
  await result(
    owner.client.from("recipe_shares").insert({
      recipe_id: source.id,
      shared_by: owner.id,
      shared_with: recipient.id,
    }),
  );

  const form = copyForm(await sharedPage(recipient));
  await submit(outsider, form);
  const outsiderCopies = await result(
    outsider.client
      .from("recipes")
      .select("id")
      .eq("source_recipe_id", source.id),
  );
  assert.equal(outsiderCopies.length, 0);
  pass("an unrelated user cannot copy a private recipe");

  await submit(recipient, form);
  const copies = await result(
    recipient.client
      .from("recipes")
      .select(
        "id, title, ingredients, steps, tip, owner_id, source_recipe_id, image_url, collection_tags",
      )
      .eq("source_recipe_id", source.id),
  );
  assert.equal(copies.length, 1);
  assert.equal(copies[0].owner_id, recipient.id);
  assert.equal(copies[0].title, "Friend's tomato soup");
  assert.deepEqual(copies[0].ingredients, ["Tomatoes", "Stock"]);
  pass("the recipient saves a complete recipe under their ownership");

  // Both copy paths used to write this field list out by hand, and each forgot a
  // different part of it: the catalog dropped the photograph, sharing dropped the
  // collections. Assert the whole recipe arrives, not just the parts anyone remembered.
  assert.equal(copies[0].image_url, "/favicon.ico");
  assert.deepEqual(copies[0].collection_tags, ["Comfort food"]);
  pass("the copy keeps the photograph and the collections");

  await result(
    recipient.client
      .from("recipes")
      .update({ title: "My tomato soup" })
      .eq("id", copies[0].id),
  );
  const original = await result(
    owner.client.from("recipes").select("title").eq("id", source.id).single(),
  );
  assert.equal(original.title, "Friend's tomato soup");
  pass("editing the copy leaves the shared original unchanged");

  await submit(recipient, form);
  const afterRepeat = await result(
    recipient.client
      .from("recipes")
      .select("id")
      .eq("source_recipe_id", source.id)
      .eq("status", "active"),
  );
  assert.equal(afterRepeat.length, 1);
  pass("repeating the action opens the existing active copy");

  console.log(`${checks}/${checks} shared recipe copy checks passed.`);

  if (process.argv.includes("--browser")) {
    console.log(`Browser fixture: ${recipient.email}`);
    console.log(`Password: ${recipient.password}`);
    console.log(`Shared URL: ${base}/recipes/shared`);
    const terminal = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    await terminal.question("Press Enter when browser review is complete: ");
    terminal.close();
  }
} finally {
  for (const id of users.reverse()) {
    await result(admin.auth.admin.deleteUser(id));
  }
  console.log("Disposable recipe-copy accounts and their data removed.");
}
