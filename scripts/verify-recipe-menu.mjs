// The recipe menu is now the only route to sharing and to the catalog, so a break
// here makes both unreachable without any page failing to render.
// Run with: node --env-file=.env.local scripts/verify-recipe-menu.mjs
import assert from "node:assert/strict";

import { JSDOM } from "jsdom";

import {
  account,
  admin,
  base,
  cleanUp,
  pass,
  result,
  summary,
} from "./lib/harness.mjs";

const owner = await account({
  label: "recipe-menu-owner",
  name: "ownerProbe",
});
const buddy = await account({
  label: "recipe-menu-buddy",
  name: "buddyProbe",
});

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
  // A planned meal must not keep a recipe alive: deleting it empties the slot rather
  // than refusing, which is what the planner shows for a meal nobody has chosen.
  const { data: planned } = await admin
    .from("recipes")
    .insert({
      owner_id: owner.id,
      title: "Planned dish",
      ingredients: ["X"],
      steps: ["Y"],
      prep_minutes: 10,
      servings: 1,
      meal_tags: ["dinner"],
    })
    .select("id")
    .single();
  const { data: plan } = await admin
    .from("meal_plans")
    .insert({ user_id: owner.id, week_start: "2026-09-07" })
    .select("id")
    .single();
  await admin.from("meal_plan_items").insert({
    meal_plan_id: plan.id,
    recipe_id: planned.id,
    day_index: 6,
    slot: "dinner",
    slot_index: 0,
    approved: true,
  });

  const path = `/recipes/${planned.id}`;
  const document = new JSDOM(await get(path, owner.cookie)).window.document;
  const form = [...document.forms].find((entry) =>
    entry.className.includes("hidden"),
  );
  assert(form, "the delete form is on the recipe");
  const data = new FormData();
  for (const input of form.querySelectorAll("input[name]")) {
    data.set(input.name, input.value);
  }
  assert(
    [...data.keys()].some((name) => name.startsWith("$ACTION_")),
    "Server action is wired into the delete form",
  );
  const deletion = await fetch(`${base}${path}`, {
    method: "POST",
    body: data,
    redirect: "manual",
    headers: { cookie: owner.cookie, origin: new URL(base).origin },
  });
  await deletion.body.cancel();

  assert.deepEqual(
    await result(admin.from("recipes").select("id").eq("id", planned.id)),
    [],
  );
  pass("a planned recipe can still be deleted");

  assert.deepEqual(
    await result(
      admin.from("meal_plan_items").select("id").eq("recipe_id", planned.id),
    ),
    [],
  );
  pass("and the slot it filled goes back to empty");

  summary("recipe menu checks passed");
} finally {
  await cleanUp("Disposable recipe-menu accounts and their data removed.");
}
