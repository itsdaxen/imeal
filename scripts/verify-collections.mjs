// Verifies collections end to end: the catalog filters, planning straight from the
// catalog, and the per-recipe collections menu.
// Run with: node --env-file=.env.local scripts/verify-collections.mjs
import assert from "node:assert/strict";

// This script used to build its own account and session by hand, which is how it came
// to be the one verifier that never learned about first-run setup and reported the
// onboarding page as a missing recipe.
import { account, admin, cleanUp, result as r } from "./lib/harness.mjs";

const user = await account({
  label: "coll",
  name: "Collections Probe",
});
let pass = 0;
const ok = (l) => {
  pass++;
  console.log("PASS", l);
};
try {
  const cookie = user.cookie;

  // a public catalog recipe carrying collections
  const pub = await r(
    admin
      .from("recipes")
      .insert({
        owner_id: null,
        title: "Probe Ramen",
        ingredients: ["Noodles"],
        steps: ["Boil."],
        prep_minutes: 20,
        servings: 2,
        meal_tags: ["dinner"],
        collection_tags: ["asian", "quick"],
        visibility: "public",
        status: "active",
      })
      .select("id")
      .single(),
  );

  const get = async (path) => {
    const res = await fetch("http://localhost:3000" + path, {
      headers: { cookie },
    });
    return { status: res.status, text: await res.text() };
  };

  let res = await get("/catalog");
  assert.equal(res.status, 200);
  assert.match(res.text, /Probe Ramen/);
  ok("catalog lists the recipe");

  res = await get("/catalog?collection=asian");
  assert.match(res.text, /Probe Ramen/);
  ok("collection filter matches");

  res = await get("/catalog?collection=nordic");
  assert.equal(/Probe Ramen/.test(res.text), false);
  ok("collection filter excludes non-matches");

  res = await get("/catalog?mealTag=breakfast");
  assert.equal(/Probe Ramen/.test(res.text), false);
  ok("meal filter excludes non-matches");

  res = await get("/catalog?mealTag=dinner");
  assert.match(res.text, /Probe Ramen/);
  ok("meal filter matches");

  res = await get(`/recipes/${pub.id}`);
  assert.equal(res.status, 200);
  assert.match(res.text, /Add to this week/);
  ok("a catalog recipe can be planned directly");

  await r(admin.from("recipes").delete().eq("id", pub.id));

  // A personal collection, edited from the recipe's own menu.
  const own = await r(
    admin
      .from("recipes")
      .insert({
        owner_id: user.id,
        title: "Menu Target",
        ingredients: ["X"],
        steps: ["Y"],
        prep_minutes: 10,
        servings: 1,
        meal_tags: ["dinner"],
        collection_tags: [],
      })
      .select("id")
      .single(),
  );
  await r(
    admin.from("recipes").insert({
      owner_id: user.id,
      title: "Other",
      ingredients: ["X"],
      steps: ["Y"],
      prep_minutes: 10,
      servings: 1,
      meal_tags: ["dinner"],
      collection_tags: ["asian favorites"],
    }),
  );

  let detail = await get(`/recipes/${own.id}`);
  assert.match(detail.text, /Recipe options/);
  ok("the owner menu is on the recipe");
  assert.match(detail.text, /asian favorites/);
  ok("existing collections reach the client for the dialog");

  const upd = await user.client
    .from("recipes")
    .update({ collection_tags: ["asian favorites", "weeknight"] })
    .eq("id", own.id)
    .eq("owner_id", user.id);
  assert.equal(upd.error, null);
  const after = await r(
    admin.from("recipes").select("collection_tags").eq("id", own.id).single(),
  );
  assert.deepEqual([...after.collection_tags].sort(), [
    "asian favorites",
    "weeknight",
  ]);
  ok("collections persist on the recipe");

  const list = await get("/recipes?collection=asian+favorites");
  assert.match(list.text, /Menu Target/);
  ok("filtering by a personal collection finds it");

  console.log(`\n${pass}/${pass} collection checks passed.`);
} finally {
  await cleanUp("Disposable collections account removed.");
}
