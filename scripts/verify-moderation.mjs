// The moderation page must not exist for anyone but a moderator, and must still work
// for one. Run with: node --env-file=.env.local scripts/verify-moderation.mjs
//
// The gate is split across the layout and the page on purpose, and each half fails
// differently: without the layout's the reply is a 200 titled "Moderation", and
// without the page's the refusal still carries the page's heading in its payload.
import assert from "node:assert/strict";

import {
  account,
  admin,
  base,
  cleanUp,
  pass,
  result,
  summary,
} from "./lib/harness.mjs";

const open = async (user) => {
  const response = await fetch(`${base}/admin`, {
    headers: { cookie: user.cookie },
    redirect: "manual",
  });

  return { status: response.status, html: await response.text() };
};

try {
  const author = await account({
    label: "moderation-author",
    name: "An Author",
  });
  const { data: recipe } = await admin
    .from("recipes")
    .insert({
      owner_id: author.id,
      title: "Awaiting moderation",
      ingredients: ["X"],
      steps: ["Y"],
      prep_minutes: 10,
      servings: 1,
      meal_tags: ["dinner"],
    })
    .select("id")
    .single();
  await result(
    admin
      .from("recipe_suggestions")
      .insert({ recipe_id: recipe.id, suggested_by: author.id }),
  );

  const outsider = await account({
    label: "moderation-outsider",
    name: "Not Admin",
  });
  const refused = await open(outsider);
  assert.equal(refused.status, 404);
  pass("the moderation page does not exist for an ordinary cook");

  assert.equal(/<title>Moderation/.test(refused.html), false);
  assert.equal(refused.html.includes("Approving copies the recipe"), false);
  assert.equal(refused.html.includes("Awaiting moderation"), false);
  pass("and the refusal gives nothing of the page away");

  const moderator = await account({
    label: "moderation-admin",
    name: "A Moderator",
  });
  await result(
    admin
      .from("user_roles")
      .update({ role: "admin" })
      .eq("user_id", moderator.id),
  );
  const allowed = await open(moderator);
  assert.equal(allowed.status, 200);
  assert.match(allowed.html, /Awaiting moderation/);
  pass("a moderator sees the recipes waiting on them");

  summary("moderation checks passed");
} finally {
  await cleanUp("Disposable moderation accounts and their data removed.");
}
