// Verifies that the home screen tells draft, ready, and shopping states apart.
// Run with: node --env-file=.env.local scripts/verify-dashboard.mjs
// Add --browser to keep the fixture until Enter is pressed for visual review.
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import {
  account,
  admin,
  base,
  cleanUp,
  holdForReview,
  result,
} from "./lib/harness.mjs";

function currentWeek() {
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - day + 1);
  return {
    dayIndex: day - 1,
    weekStart: [
      monday.getFullYear(),
      String(monday.getMonth() + 1).padStart(2, "0"),
      String(monday.getDate()).padStart(2, "0"),
    ].join("-"),
  };
}

try {
  const probe = await account({ label: "dashboard", name: "Dashboard Probe" });
  const recipes = await result(
    probe.client
      .from("recipes")
      .insert([
        {
          owner_id: probe.id,
          title: "Draft breakfast",
          ingredients: ["Oats"],
          steps: ["Cook gently."],
          prep_minutes: 10,
          servings: 1,
          meal_tags: ["breakfast"],
        },
        {
          owner_id: probe.id,
          title: "Ready dinner",
          ingredients: ["Beans"],
          steps: ["Simmer."],
          prep_minutes: 30,
          servings: 2,
          meal_tags: ["dinner"],
        },
      ])
      .select("id, title"),
  );
  const { dayIndex, weekStart } = currentWeek();
  const plan = await result(
    probe.client
      .from("meal_plans")
      .insert({
        user_id: probe.id,
        week_start: weekStart,
        enabled_slots: ["breakfast", "dinner"],
      })
      .select("id")
      .single(),
  );
  const draft = recipes.find((recipe) => recipe.title === "Draft breakfast");
  const ready = recipes.find((recipe) => recipe.title === "Ready dinner");
  assert(draft && ready);
  await result(
    probe.client.from("meal_plan_items").insert([
      {
        meal_plan_id: plan.id,
        recipe_id: draft.id,
        day_index: dayIndex,
        slot: "breakfast",
        approved: false,
      },
      {
        meal_plan_id: plan.id,
        recipe_id: ready.id,
        day_index: dayIndex,
        slot: "dinner",
        approved: true,
      },
    ]),
  );
  const response = await fetch(base, { headers: { cookie: probe.cookie } });
  const document = new JSDOM(await response.text()).window.document;
  const text = document.body.textContent;
  assert.equal(response.status, 200);
  assert.match(text, /1 approved · 1 to review/);
  assert.match(text, /Draft breakfast/);
  assert.match(text, /awaiting approval/);
  assert.match(text, /DraftReview/);
  assert.match(text, /Ready dinner/);
  assert.match(text, /ReadyCook/);
  assert.match(text, /Your shopping list is empty/);
  console.log(
    "PASS dashboard distinguishes proposals, ready meals, and an empty list",
  );

  await holdForReview([
    `Browser fixture: ${probe.email}`,
    `Password: ${probe.password}`,
    `Dashboard URL: ${base}`,
  ]);
} finally {
  await cleanUp("Disposable dashboard account and its data removed.", (id) =>
    result(admin.from("meal_plans").delete().eq("user_id", id)),
  );
}
