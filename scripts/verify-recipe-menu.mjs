// The recipe menu is now the only route to sharing and to the catalog, so a break
// here makes both unreachable without any page failing to render.
// Run with: node --env-file=.env.local scripts/verify-recipe-menu.mjs
import assert from "node:assert/strict";

import {
  account,
  admin,
  base,
  cleanUp,
  pass,
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
  summary("recipe menu checks passed");
} finally {
  await cleanUp("Disposable recipe-menu accounts and their data removed.");
}
