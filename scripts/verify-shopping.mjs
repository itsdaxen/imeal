// Exercises real shopping forms using disposable users. Requires a running app.
// Run with: node --env-file=.env.local scripts/verify-shopping.mjs
// Add --browser to keep the fixture until Enter is pressed for visual review.
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

const week = "2026-09-07";
async function page(user, listId, at) {
  const path = at ?? `/shopping?week=${week}${listId ? `&list=${listId}` : ""}`;
  const response = await fetch(`${base}${path}`, {
    headers: { cookie: user.cookie },
  });
  const dom = new JSDOM(await response.text());
  return { path, document: dom.window.document, status: response.status };
}

async function submit(user, rendered, selectForm, values = {}) {
  const form = [...rendered.document.forms].find(selectForm);
  assert(form, "Expected form is present");
  const data = new FormData();
  for (const input of form.querySelectorAll("input[name]"))
    data.set(input.name, input.value);
  for (const [name, value] of Object.entries(values)) data.set(name, value);
  assert(
    [...data.keys()].some((name) => name.startsWith("$ACTION_")),
    "Server action is wired",
  );
  const response = await fetch(`${base}${rendered.path}`, {
    method: "POST",
    body: data,
    redirect: "manual",
    headers: { cookie: user.cookie, origin: new URL(base).origin },
  });
  await response.text();
  assert(response.status < 400, `Form returned ${response.status}`);
  return data;
}

const button = (label) => (form) =>
  [...form.querySelectorAll("button")].some(
    (entry) => entry.textContent.trim() === label,
  );
const items = (user, listId) =>
  result(
    user.client
      .from("shopping_items")
      .select("id, name, meal_plan_id, source, checked")
      .eq("list_id", listId),
  );

try {
  await fetch(`${base}/sign-in`);
  const owner = await account({ label: "shopping", name: "Shopping Probe" });
  const friend = await account({ label: "shopping", name: "Shopping Probe" });
  const defaultList = await result(
    owner.client
      .from("shopping_lists")
      .select("id")
      .eq("is_default", true)
      .single(),
  );
  let rendered = await page(owner);
  assert(rendered.document.querySelector('input[name="name"]'));
  await submit(owner, rendered, button("Add"), { name: "Keep in default" });
  assert.equal((await items(owner, defaultList.id)).length, 1);
  pass("manual shopping works without a plan");

  // Creating a list is a dialog now, so the fixture is made directly; what this
  // script is for is whether lists stay independent once they exist.
  const party = await result(
    owner.client
      .from("shopping_lists")
      .insert({ owner_id: owner.id, name: "Party" })
      .select("id")
      .single(),
  );
  await result(
    owner.client
      .from("shopping_list_members")
      .insert({ list_id: party.id, user_id: owner.id }),
  );
  rendered = await page(owner, party.id);
  assert.equal(rendered.document.querySelector("h1").textContent, "Party");
  await submit(owner, rendered, button("Add"), {
    name: "Limes",
    quantity: "3",
  });
  assert.equal((await items(owner, party.id))[0].name, "Limes");
  assert.equal((await items(owner, defaultList.id)).length, 1);
  pass("a second list takes its own manual entries");

  await result(
    owner.client.from("staples").insert([
      { user_id: owner.id, name: "Salt", active: true },
      { user_id: owner.id, name: "Paused", active: false },
    ]),
  );
  // Staples now land from the list menu, which is client-side, so the behaviour is
  // asserted in shopping.test.ts rather than driven through a form here.
  await result(
    owner.client.from("shopping_items").insert({
      user_id: owner.id,
      list_id: party.id,
      name: "Salt",
      source: "staple",
    }),
  );
  pass("staples are list-owned and paused staples stay out");

  const hidden = await page(friend, party.id);
  assert.match(hidden.document.body.textContent, /This list is unavailable/);
  assert.equal((await items(friend, party.id)).length, 0);
  const refused = await friend.client
    .from("shopping_items")
    .insert({ user_id: friend.id, list_id: party.id, name: "Forbidden" });
  assert(refused.error);
  pass("non-members cannot read or add to an explicit list");

  await result(
    admin
      .from("shopping_list_members")
      .insert({ list_id: party.id, user_id: friend.id }),
  );
  const shared = await page(friend, party.id);
  assert.equal(shared.document.querySelector("h1").textContent, "Party");
  await submit(friend, shared, button("Add"), { name: "Shared item" });
  assert(
    (await items(owner, party.id)).some((item) => item.name === "Shared item"),
  );
  pass("members can open and add to a shared list without a plan");

  const plan = await result(
    owner.client
      .from("meal_plans")
      .insert({ user_id: owner.id, week_start: week })
      .select("id")
      .single(),
  );
  rendered = await page(owner, party.id);
  await result(owner.client.from("meal_plans").delete().eq("id", plan.id));
  assert((await items(owner, party.id)).some((item) => item.name === "Limes"));
  assert((await items(owner, party.id)).some((item) => item.name === "Salt"));
  pass("deleting a plan preserves new manual items and staples");

  await result(
    owner.client.from("shopping_items").delete().eq("list_id", defaultList.id),
  );
  assert.equal((await items(owner, defaultList.id)).length, 0);
  assert((await items(owner, party.id)).length > 0);
  pass("clearing the open list leaves other lists untouched");

  if (process.argv.includes("--browser")) {
    console.log(`Browser fixture: ${owner.email}`);
    const terminal = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    await terminal.question("Press Enter when browser review is complete: ");
    terminal.close();
  }
  // Deleting is a menu action now; what matters here is that the default survives it.
  await result(owner.client.from("shopping_lists").delete().eq("id", party.id));
  assert.equal(
    (
      await result(
        owner.client.from("shopping_lists").select("id").eq("id", party.id),
      )
    ).length,
    0,
  );
  assert.equal(
    (
      await result(
        owner.client
          .from("shopping_lists")
          .select("id")
          .eq("id", defaultList.id),
      )
    ).length,
    1,
  );
  pass("deleting a named list returns to shopping and preserves the default");
  // The planner names a destination in two places — the button and the selector under
  // More options — and a week often points at a list nothing chose on purpose. This is
  // the case where the two used to disagree and the items went somewhere else.
  const cook = await account({ label: "planner", name: "Rosa Planner" });
  const plannerWeek = "2026-09-07";
  const [seeded] = await result(
    cook.client.from("shopping_lists").select("id").eq("owner_id", cook.id),
  );
  await result(
    cook.client
      .from("shopping_lists")
      .update({ is_default: false })
      .eq("id", seeded.id),
  );
  const market = await result(
    cook.client
      .from("shopping_lists")
      .insert({ name: "Market", owner_id: cook.id, is_default: true })
      .select("id")
      .single(),
  );
  await result(
    cook.client
      .from("shopping_list_members")
      .insert({ list_id: market.id, user_id: cook.id }),
  );
  const soup = await result(
    cook.client
      .from("recipes")
      .insert({
        title: "Lentil soup",
        owner_id: cook.id,
        ingredients: ["Lentils", "Cumin"],
        meal_tags: ["dinner"],
      })
      .select("id")
      .single(),
  );
  const stalePlan = await result(
    cook.client
      .from("meal_plans")
      .insert({
        user_id: cook.id,
        week_start: plannerWeek,
        target_list_id: seeded.id,
      })
      .select("id")
      .single(),
  );
  const plannedMeal = await result(
    cook.client
      .from("meal_plan_items")
      .insert({
        meal_plan_id: stalePlan.id,
        recipe_id: soup.id,
        day_index: 0,
        slot: "dinner",
        slot_index: 0,
        approved: false,
      })
      .select("id")
      .single(),
  );

  const planner = await page(cook, null, `/planner?week=${plannerWeek}`);
  const offered = await submit(cook, planner, button("Add to shopping list"));
  assert.equal(offered.get("listId"), market.id);
  assert(
    (await items(cook, market.id)).some((item) =>
      item.name.toLowerCase().includes("lentils"),
    ),
  );
  assert.equal((await items(cook, seeded.id)).length, 0);
  const approvedMeal = await result(
    cook.client
      .from("meal_plan_items")
      .select("approved")
      .eq("id", plannedMeal.id)
      .single(),
  );
  assert.equal(approvedMeal.approved, true);
  pass("the planner fills the list it says it will and approves every meal");

  summary("shopping checks passed");
} finally {
  await cleanUp("Disposable shopping accounts and their data removed.", (id) =>
    result(admin.from("meal_plans").delete().eq("user_id", id)),
  );
}
