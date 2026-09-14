// Applying an organized list: what the database does with a proposal once a person
// has accepted it. Run with: node --env-file=.env.local scripts/verify-tidy-apply.mjs
//
// The model half is measured by `pnpm eval`. This is the other half, and the one that
// destroys things: applying merges rows and deletes the ones it folded in.
import assert from "node:assert/strict";

import {
  account,
  admin,
  cleanUp,
  pass,
  result,
  summary,
} from "./lib/harness.mjs";

const listOf = (user) =>
  result(
    user.client
      .from("shopping_lists")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .single(),
  ).then((row) => row.id);

const add = (user, list, fields) =>
  result(
    user.client
      .from("shopping_items")
      .insert({ list_id: list, user_id: user.id, source: "manual", ...fields })
      .select("id, name, quantity, unit, checked, category")
      .single(),
  );

const rowsOf = (user, list) =>
  result(
    user.client
      .from("shopping_items")
      .select("id, name, quantity, unit, checked, category")
      .eq("list_id", list)
      .order("name"),
  );

const organized = (sourceIds, over = {}) => ({
  sourceIds,
  name: "tomatoes",
  category: "produce",
  quantity: 5,
  unit: null,
  explanation: "Same shopping written twice.",
  ...over,
});

try {
  const cook = await account({ label: "tidy-apply", name: "Rosa Tidy" });
  const list = await listOf(cook);

  const one = await add(cook, list, { name: "Tomato", quantity: 2 });
  const two = await add(cook, list, { name: "tomatoes", quantity: 3 });
  const milk = await add(cook, list, {
    name: "milk",
    quantity: 1,
    checked: true,
  });

  const applied = await result(
    cook.client.rpc("apply_shopping_tidy", {
      p_list: list,
      p_changes: [
        organized([one.id, two.id]),
        organized([milk.id], {
          name: "milk",
          category: "dairy",
          quantity: 1,
        }),
      ],
    }),
  );
  assert.equal(applied, 2);

  const after = await rowsOf(cook, list);
  assert.equal(after.length, 2);
  assert.deepEqual(
    after.map((row) => [row.name, row.quantity, row.category]),
    [
      ["milk", 1, "dairy"],
      ["tomatoes", 5, "produce"],
    ],
  );
  pass("a merge leaves one row holding the total");

  assert.equal(
    (
      await result(
        cook.client.from("shopping_items").select("id").eq("id", two.id),
      )
    ).length,
    0,
  );
  pass("and the row it folded in is gone");

  assert.equal(after.find((row) => row.name === "milk").checked, true);
  pass("a row nobody merged keeps whether it was collected");

  // Collected-ness cannot survive a merge with something still to buy.
  const got = await add(cook, list, {
    name: "Butter",
    quantity: 1,
    checked: true,
  });
  const notYet = await add(cook, list, {
    name: "butter",
    quantity: 1,
    checked: false,
  });
  await result(
    cook.client.rpc("apply_shopping_tidy", {
      p_list: list,
      p_changes: [
        organized([got.id, notYet.id], {
          name: "butter",
          category: "dairy",
          quantity: 2,
        }),
      ],
    }),
  );
  const butter = (await rowsOf(cook, list)).find(
    (row) => row.name === "butter",
  );
  assert.equal(butter.quantity, 2);
  assert.equal(butter.checked, false);
  pass("merging something bought with something not leaves it to buy");

  // A proposal naming rows on another list must not reach them.
  const other = await account({ label: "tidy-other", name: "Someone Else" });
  const theirList = await listOf(other);
  const theirs = await add(other, theirList, { name: "Their milk" });

  await cook.client.rpc("apply_shopping_tidy", {
    p_list: list,
    p_changes: [organized([theirs.id], { name: "stolen" })],
  });
  const untouched = await result(
    admin
      .from("shopping_items")
      .select("name, quantity")
      .eq("id", theirs.id)
      .single(),
  );
  assert.deepEqual(untouched, { name: "Their milk", quantity: 1 });
  pass("a proposal cannot reach a row on somebody else's list");

  // Building the list again deletes generated rows whose name no longer matches an
  // ingredient — and organizing renames them. A manual row folded into a generated
  // one used to vanish on the next build, along with the shopping it held.
  const week = "2026-09-14";
  const recipe = await result(
    cook.client
      .from("recipes")
      .insert({
        title: "Anchovy pasta",
        owner_id: cook.id,
        ingredients: ["Anchovies"],
        steps: ["Cook."],
        meal_tags: ["dinner"],
      })
      .select("id")
      .single(),
  );
  const plan = await result(
    cook.client
      .from("meal_plans")
      .insert({ user_id: cook.id, week_start: week, target_list_id: list })
      .select("id")
      .single(),
  );
  await result(
    cook.client.from("meal_plan_items").insert({
      meal_plan_id: plan.id,
      recipe_id: recipe.id,
      day_index: 0,
      slot: "dinner",
      slot_index: 3,
      approved: true,
    }),
  );
  await result(
    cook.client.rpc("sync_generated_shopping_items", { p_week_start: week }),
  );

  const fromThePlan = (await rowsOf(cook, list)).find(
    (row) => row.name === "Anchovies",
  );
  assert(fromThePlan, "the plan put its ingredient on the list");
  const byHand = await add(cook, list, { name: "anchovy", quantity: 2 });

  await result(
    cook.client.rpc("apply_shopping_tidy", {
      p_list: list,
      p_changes: [
        organized([fromThePlan.id, byHand.id], {
          name: "salted anchovies",
          quantity: 3,
        }),
      ],
    }),
  );
  await result(
    cook.client.rpc("sync_generated_shopping_items", { p_week_start: week }),
  );

  const survivors = await rowsOf(cook, list);
  const merged = survivors.find((row) => row.name === "salted anchovies");
  assert(merged, "building the list again threw away what was organized");
  assert.equal(merged.quantity, 3);
  pass("organizing a planned row keeps the shopping added by hand");

  assert.equal(
    survivors.filter((row) => row.name === "salted anchovies").length,
    1,
  );
  pass("and does not leave two of it");

  summary("tidy apply checks passed");
} finally {
  await cleanUp("Disposable tidy accounts and their lists removed.");
}
