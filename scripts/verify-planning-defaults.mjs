// Changing the shape of a day in settings must reach the week you are looking at.
// Run with: node --env-file=.env.local scripts/verify-planning-defaults.mjs
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

const monday = new Date();
monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
const thisWeek = monday.toISOString().slice(0, 10);
const later = new Date(monday);
later.setUTCDate(later.getUTCDate() + 7);
const nextWeek = later.toISOString().slice(0, 10);

async function get(user, path) {
  const response = await fetch(`${base}${path}`, {
    headers: { cookie: user.cookie },
  });
  assert.equal(response.status, 200, `${path} returned ${response.status}`);
  return new JSDOM(await response.text()).window.document;
}

/** The kinds of meal More options offers, and which of them are chosen. */
async function kinds(user, week) {
  const doc = await get(user, `/planner?week=${week}`);
  return [
    ...doc.querySelectorAll('input[name="slots"][type="checkbox"]'),
  ].flatMap((box) => (box.checked ? [box.value] : []));
}

async function saveDefaults(user, types, perDay) {
  const doc = await get(user, "/profile");
  const form = [...doc.forms].find((entry) =>
    entry.querySelector('input[name="defaultMealTypes"]'),
  );
  assert(form, "The profile offers planning defaults");

  const data = new FormData();
  for (const input of form.querySelectorAll("input[name]")) {
    if (input.type === "checkbox" || input.type === "radio") {
      if (input.checked && input.name !== "defaultMealTypes") {
        data.append(input.name, input.value);
      }
    } else if (input.type !== "file") {
      data.set(input.name, input.value);
    }
  }
  for (const type of types) data.append("defaultMealTypes", type);
  data.set("defaultMealsPerDay", String(perDay));
  assert(
    [...data.keys()].some((name) => name.startsWith("$ACTION_")),
    "Server action is wired",
  );

  const response = await fetch(`${base}/profile`, {
    method: "POST",
    body: data,
    redirect: "manual",
    headers: { cookie: user.cookie, origin: new URL(base).origin },
  });
  await response.text();
  assert(response.status < 400, `Settings returned ${response.status}`);
}

const shapeOf = (user, plan) =>
  result(
    user.client.from("meal_plans").select("day_slots").eq("id", plan).single(),
  ).then((row) => row.day_slots);

try {
  const cook = await account({ label: "planning", name: "Rosa Planning" });
  const soup = await result(
    cook.client
      .from("recipes")
      .insert({
        title: "Soup",
        owner_id: cook.id,
        ingredients: ["Salt"],
        meal_tags: ["dinner"],
      })
      .select("id")
      .single(),
  );

  // The week is already under way: it has a row of its own, which is what used to
  // put it beyond the reach of the setting.
  const plan = await result(
    cook.client
      .from("meal_plans")
      .insert({ user_id: cook.id, week_start: thisWeek })
      .select("id")
      .single(),
  );
  await result(
    cook.client.from("meal_plan_items").insert({
      meal_plan_id: plan.id,
      recipe_id: soup.id,
      day_index: 0,
      slot: "dinner",
      slot_index: 3,
      approved: true,
    }),
  );

  // Thursday is given a fifth meal by hand, which no setting should take away.
  const before = await shapeOf(cook, plan.id);
  before[3] = [...before[3], "dinner"];
  await result(
    cook.client
      .from("meal_plans")
      .update({ day_slots: before })
      .eq("id", plan.id),
  );

  assert.deepEqual(await kinds(cook, thisWeek), [
    "breakfast",
    "lunch",
    "snack",
    "dinner",
  ]);

  await saveDefaults(cook, ["lunch", "snack", "dinner"], 3);

  assert.deepEqual(await kinds(cook, thisWeek), ["lunch", "snack", "dinner"]);
  pass("dropping a kind of meal reaches the week already under way");

  assert.deepEqual(await kinds(cook, nextWeek), ["lunch", "snack", "dinner"]);
  pass("and the weeks that have not started");

  const after = await shapeOf(cook, plan.id);
  assert.deepEqual(after[0], ["lunch", "snack", "dinner"]);
  assert.deepEqual(after[3], [
    "breakfast",
    "lunch",
    "snack",
    "dinner",
    "dinner",
  ]);
  pass("a day shaped by hand keeps the shape it was given");

  // Left behind, it would be invisible in the planner and still fill the shopping
  // list, which reads every planned meal.
  assert.deepEqual(
    await result(
      cook.client
        .from("meal_plan_items")
        .select("slot_index")
        .eq("meal_plan_id", plan.id),
    ),
    [],
  );
  pass("a meal past the end of a shortened day is cleared");

  summary("planning default checks passed");
} finally {
  await cleanUp("Disposable planning account and its data removed.", (id) =>
    result(admin.from("meal_plans").delete().eq("user_id", id)),
  );
}
