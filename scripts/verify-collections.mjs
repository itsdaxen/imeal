// Verifies collections end to end: the catalog filters, planning straight from the
// catalog, and the per-recipe collections menu.
// Run with: node --env-file=.env.local scripts/verify-collections.mjs
import assert from "node:assert/strict";

// Accounts come from the harness so every verifier starts past first-run setup. A
// script that builds its own session skips it and reads the onboarding page as a
// missing recipe.
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
        // A tag of its own, so a filtered catalog holds this and nothing else.
        collection_tags: ["probe-only"],
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

  // This recipe has no owner, so removing the disposable account cannot take it
  // with it. Cleanup belongs in `finally`: a check that throws would otherwise
  // leave a public recipe in the live catalog for good.
  try {
    // Every check below narrows the catalog to this one recipe first. The catalog
    // holds a hundred-odd recipes and renders the first page of them, so looking for a
    // recipe in an unfiltered page says nothing about filtering — and not finding one
    // says nothing either, since it may simply be on a later page. That the catalog
    // renders at all is verify-routes' job.
    let res = await get("/catalog?collection=probe-only");
    assert.equal(res.status, 200);
    assert.match(res.text, /Probe Ramen/);
    ok("a collection filter finds the recipe carrying that collection");

    res = await get("/catalog?collection=nordic");
    assert.equal(/Probe Ramen/.test(res.text), false);
    ok("and leaves it out of a collection it is not in");

    res = await get("/catalog?collection=probe-only&mealTag=dinner");
    assert.match(res.text, /Probe Ramen/);
    ok("a meal filter keeps a recipe tagged for that meal");

    res = await get("/catalog?collection=probe-only&mealTag=breakfast");
    assert.equal(/Probe Ramen/.test(res.text), false);
    ok("and drops one that is not");

    res = await get("/catalog?collection=probe-only&search=Ramen");
    assert.match(res.text, /Probe Ramen/);
    ok("searching the catalog finds it by title");

    res = await get(`/recipes/${pub.id}`);
    assert.equal(res.status, 200);
    assert.match(res.text, /Add to this week/);
    ok("a catalog recipe can be planned directly");
  } finally {
    await r(admin.from("recipes").delete().eq("id", pub.id));
  }

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
