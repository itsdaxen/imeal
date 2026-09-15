// Pressing Generate plan replaces the week, and the default list offers no way to
// delete itself. Run with: node --env-file=.env.local scripts/verify-plan-replacement.mjs
//
// Driven through the page rather than the database: the first version of this check
// called the function directly and passed while the menu it was meant to fix still
// offered Delete on the default list.
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

const week = "2026-09-14";

async function page(user, path) {
  const response = await fetch(`${base}${path}`, {
    headers: { cookie: user.cookie },
  });
  assert.equal(response.status, 200, `${path} returned ${response.status}`);

  return new JSDOM(await response.text()).window.document;
}

async function submit(user, path, form, overrides = {}) {
  const data = new FormData();
  for (const input of form.querySelectorAll("input[name]")) {
    if (input.type === "checkbox" || input.type === "radio") {
      if (input.checked) data.append(input.name, input.value);
    } else {
      data.set(input.name, input.value);
    }
  }
  for (const [name, value] of Object.entries(overrides)) data.set(name, value);
  assert(
    [...data.keys()].some((name) => name.startsWith("$ACTION_")),
    "the form carries a server action",
  );

  const response = await fetch(`${base}${path}`, {
    method: "POST",
    body: data,
    redirect: "manual",
    headers: { cookie: user.cookie, origin: new URL(base).origin },
  });
  await response.body?.cancel();
  assert(response.status < 400, `the form returned ${response.status}`);
}

const plannedFor = (user, plan) =>
  result(
    user.client
      .from("meal_plan_items")
      .select("id, approved, recipes (title)")
      .eq("meal_plan_id", plan),
  );

try {
  const cook = await account({ label: "replace-plan", name: "Rosa Replace" });

  // One dinner a day for seven days, so seven distinct dinners are enough to fill it.
  await result(
    cook.client.from("recipes").insert(
      Array.from({ length: 7 }, (_, index) => ({
        title: `Dinner ${index + 1}`,
        owner_id: cook.id,
        ingredients: [`Ingredient ${index + 1}`],
        steps: ["Cook."],
        meal_tags: ["dinner"],
      })),
    ),
  );

  const planner = await page(cook, `/planner?week=${week}`);
  const fillForm = [...planner.forms].find((form) =>
    /Generate plan/.test(form.textContent),
  );
  assert(fillForm, "the planner offers to generate a plan");

  await submit(cook, `/planner?week=${week}`, fillForm, {
    source: "mine",
    slots: "dinner",
    mealsPerDay: "1",
  });

  const plan = await result(
    cook.client
      .from("meal_plans")
      .select("id")
      .eq("user_id", cook.id)
      .eq("week_start", week)
      .single(),
  );
  const first = await plannedFor(cook, plan.id);
  assert.equal(first.length, 7, "a week of dinners was filled");
  pass("generating from the page fills the week");

  // Approving is what the old plan had that the new one must still replace.
  await result(
    cook.client
      .from("meal_plan_items")
      .update({ approved: true })
      .eq("id", first[0].id),
  );

  await submit(cook, `/planner?week=${week}`, fillForm, {
    source: "mine",
    slots: "dinner",
    mealsPerDay: "1",
  });

  const second = await plannedFor(cook, plan.id);
  assert.equal(second.length, 7, "the week still holds seven dinners");
  assert.equal(
    second.some((meal) => meal.id === first[0].id),
    false,
    "an approved meal from the old plan survived",
  );
  assert.equal(
    second.filter((meal) => meal.approved).length,
    0,
    "the new plan arrived already approved",
  );
  pass("and replaces an approved meal rather than keeping it");

  // Deleting the default is allowed; what cannot happen is ending up with none,
  // because every week without a chosen destination falls back to one.
  const lists = await result(
    cook.client
      .from("shopping_lists")
      .select("id, is_default")
      .eq("owner_id", cook.id),
  );
  const fallback = lists.find((list) => list.is_default);
  assert(fallback, "the account has a default list");

  const spare = await result(
    cook.client
      .from("shopping_lists")
      .insert({ name: "Market", owner_id: cook.id })
      .select("id")
      .single(),
  );
  await result(
    cook.client
      .from("shopping_list_members")
      .insert({ list_id: spare.id, user_id: cook.id }),
  );

  await result(
    cook.client.from("shopping_lists").delete().eq("id", fallback.id),
  );
  assert.equal(
    (
      await result(
        admin.from("shopping_lists").select("id").eq("id", fallback.id),
      )
    ).length,
    0,
  );
  pass("the default list can be thrown away like any other");

  const heir = await result(
    admin
      .from("shopping_lists")
      .select("id, is_default")
      .eq("id", spare.id)
      .single(),
  );
  assert.equal(heir.is_default, true);
  pass("and the list left behind becomes the default");

  const { error: lastOne } = await cook.client
    .from("shopping_lists")
    .delete()
    .eq("id", spare.id);
  assert(lastOne, "deleting the only list was allowed");
  assert.equal(
    (await result(admin.from("shopping_lists").select("id").eq("id", spare.id)))
      .length,
    1,
  );
  pass("but the last list stays, because everything falls back to one");

  summary("plan replacement checks passed");
} finally {
  await cleanUp("Disposable replacement account and its data removed.", (id) =>
    result(admin.from("meal_plans").delete().eq("user_id", id)),
  );
}
