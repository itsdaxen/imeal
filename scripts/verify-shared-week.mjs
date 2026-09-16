// A week shared with you is readable under RLS, so any lookup of "the plan for this
// week" that filters on the date alone matches two rows and fails. This reproduces
// that: two people, one shared week, then the planner must still load.
// Run with: node --env-file=.env.local scripts/verify-shared-week.mjs
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

function mondayOf(date = new Date()) {
  const day = date.getDay() || 7;
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - day + 1);
  return [
    monday.getFullYear(),
    String(monday.getMonth() + 1).padStart(2, "0"),
    String(monday.getDate()).padStart(2, "0"),
  ].join("-");
}

const owner = await account({
  label: "shared-week-owner",
  name: "ownerProbe",
});
const buddy = await account({
  label: "shared-week-buddy",
  name: "buddyProbe",
});

try {
  const weekStart = mondayOf();

  const { data: theirs } = await admin
    .from("meal_plans")
    .insert({ user_id: owner.id, week_start: weekStart })
    .select("id")
    .single();
  const { data: mine } = await admin
    .from("meal_plans")
    .insert({ user_id: buddy.id, week_start: weekStart })
    .select("id")
    .single();
  assert(theirs.id !== mine.id);

  // Share the owner's week with buddy: now buddy can read two plans for this date.
  const { error: shareError } = await admin.from("meal_plan_shares").insert({
    meal_plan_id: theirs.id,
    owner_id: owner.id,
    recipient_id: buddy.id,
  });
  assert.equal(shareError, null);

  const visible = await buddy.client
    .from("meal_plans")
    .select("id")
    .eq("week_start", weekStart);
  assert.equal(visible.data.length, 2);
  pass("a shared week makes two plans readable for the same date");

  const page = await fetch(`${base}/planner?week=${weekStart}`, {
    headers: { cookie: buddy.cookie },
  });
  const html = await page.text();
  assert.equal(page.status, 200);
  assert.equal(
    /Could not load the week|multiple \(or no\) rows/.test(html),
    false,
    "planner still failed to load the week",
  );
  pass("the planner loads the recipient's own week regardless");

  // Copying is the point of sharing, and it quietly stopped working twice: once when
  // a day became a list of meals and the function still wrote a column that had gone,
  // and again because a recipient may read a shared week but not the private recipes
  // inside it, so the copy joined them away to nothing.
  const { data: recipe } = await admin
    .from("recipes")
    .insert({
      owner_id: owner.id,
      title: "Owner's private dinner",
      ingredients: ["Salt"],
      steps: ["Cook."],
      prep_minutes: 10,
      servings: 2,
      meal_tags: ["dinner"],
    })
    .select("id")
    .single();
  await admin.from("meal_plan_items").insert({
    meal_plan_id: theirs.id,
    recipe_id: recipe.id,
    day_index: 2,
    slot_index: 3,
    slot: "dinner",
    approved: true,
  });

  const { error: copyError } = await buddy.client.rpc("copy_shared_plan", {
    p_meal_plan_id: theirs.id,
    p_week_start: weekStart,
  });
  assert.equal(copyError, null, "copying a shared week failed");

  const copiedItems = await result(
    buddy.client
      .from("meal_plan_items")
      .select("day_index, slot_index, slot")
      .eq("meal_plan_id", mine.id),
  );
  assert.equal(copiedItems.length, 1);
  assert.deepEqual(copiedItems[0], {
    day_index: 2,
    slot_index: 3,
    slot: "dinner",
  });
  pass("copying a shared week brings its meals across");

  const ownCopy = await result(
    buddy.client
      .from("recipes")
      .select("id, title")
      .eq("source_recipe_id", recipe.id),
  );
  assert.equal(ownCopy.length, 1);
  assert.equal(ownCopy[0].title, "Owner's private dinner");
  pass("and the recipe with it, as a copy of their own");

  // The share is the permission; without one the function hands over nothing.
  const stranger = await account({
    label: "shared-week-stranger",
    name: "strangerProbe",
  });
  const { error: refused } = await stranger.client.rpc("copy_shared_plan", {
    p_meal_plan_id: theirs.id,
    p_week_start: weekStart,
  });
  assert(refused, "a week nobody shared was copied anyway");
  assert.equal(
    (
      await result(
        admin
          .from("recipes")
          .select("id")
          .eq("owner_id", stranger.id)
          .eq("source_recipe_id", recipe.id),
      )
    ).length,
    0,
  );
  pass("and a week shared with nobody cannot be copied at all");

  summary("shared week checks passed");
} finally {
  await cleanUp("Disposable shared-week accounts and their data removed.");
}
