// Exercises the real shared-recipe copy form with disposable users.
// Run with: node --env-file=.env.local scripts/verify-recipe-copy.mjs
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import {
  account,
  admin,
  base,
  cleanUp,
  holdForReview,
  pass,
  result,
  summary,
} from "./lib/harness.mjs";

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
  const owner = await account({
    label: "recipe-copy-owner",
    name: "Owner Probe",
  });
  const recipient = await account({
    label: "recipe-copy-recipient",
    name: "Recipient Probe",
  });
  const outsider = await account({
    label: "recipe-copy-outsider",
    name: "Outsider Probe",
  });
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

  summary("shared recipe copy checks passed");

  await holdForReview([
    `Browser fixture: ${recipient.email}`,
    `Password: ${recipient.password}`,
    `Shared URL: ${base}/recipes/shared`,
  ]);
} finally {
  await cleanUp("Disposable recipe-copy accounts and their data removed.");
}
