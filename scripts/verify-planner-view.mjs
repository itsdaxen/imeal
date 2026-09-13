// The planner opens on one day, at every width, and says which one in the address.
// Run with: node --env-file=.env.local scripts/verify-planner-view.mjs
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

async function open(user, query) {
  const response = await fetch(`${base}/planner?week=${week}${query}`, {
    headers: { cookie: user.cookie },
  });
  assert.equal(response.status, 200);

  const document = new JSDOM(await response.text()).window.document;
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const toggle = document.querySelector(
    '[aria-label="How much of the week to show"]',
  );

  return {
    links: [...document.querySelectorAll("a")].map((link) =>
      link.getAttribute("href"),
    ),
    day: tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true"),
    // Counted by the day names on show rather than by the shape of the container:
    // the route's skeleton carries a seven-column grid of its own.
    named: new Set(
      [...document.querySelectorAll("h2, h3")]
        .map((heading) => heading.textContent.trim())
        .filter((text) =>
          /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/.test(
            text,
          ),
        ),
    ).size,
    view:
      toggle
        ?.querySelector('[data-selected], [aria-pressed="true"]')
        ?.textContent.trim() ?? null,
  };
}

try {
  const cook = await account({ label: "planner-view", name: "Rosa View" });
  const { data: recipe } = await cook.client
    .from("recipes")
    .insert({
      title: "Thursday dinner",
      owner_id: cook.id,
      ingredients: ["Salt"],
      steps: ["Cook."],
      meal_tags: ["dinner"],
    })
    .select("id")
    .single();
  const plan = await result(
    cook.client
      .from("meal_plans")
      .insert({ user_id: cook.id, week_start: week })
      .select("id")
      .single(),
  );
  await result(
    cook.client.from("meal_plan_items").insert({
      meal_plan_id: plan.id,
      recipe_id: recipe.id,
      day_index: 3,
      slot: "dinner",
      slot_index: 3,
      approved: true,
    }),
  );

  const fresh = await open(cook, "");
  assert.equal(fresh.day, 3);
  assert.equal(fresh.view, "Day");
  pass("the planner opens a day at a time, on the first day with a meal");

  assert.equal((await open(cook, "&day=5")).day, 5);
  pass("a day named in the address is the day that opens");

  assert.equal((await open(cook, "&day=9")).day, 3);
  assert.equal((await open(cook, "&day=banana")).day, 3);
  pass("a day that is not one of this week's is ignored");

  const whole = await open(cook, "&view=week");
  assert.equal(whole.view, "Week");
  assert.equal(fresh.named, 1, "one day is named when one day is shown");
  assert.equal(whole.named, 7, "every day is named when the week is shown");
  pass("asking for the whole week gives the whole week");

  assert.equal((await open(cook, "&view=week&day=5")).day, 5);
  pass("and still remembers which day you were on");

  // Filling a slot takes you out of the planner and back into it. Both directions
  // carry the day, or you return to whichever day the planner opens on rather than
  // the one you were filling.
  for (const [view, day] of [
    ["day", 4],
    ["week", 2],
  ]) {
    const asked = `&day=${day}${view === "week" ? "&view=week" : ""}`;
    const planner = await open(cook, asked);
    const toChooser = planner.links.find(
      (href) =>
        href?.includes("/planner/assign") &&
        href.includes(`day=${day}`) &&
        href.includes("slot=dinner"),
    );
    assert(toChooser, `the ${view} view offers an empty dinner on day ${day}`);
    assert.match(toChooser, new RegExp(`view=${view}`));

    const chooser = new JSDOM(
      await (
        await fetch(`${base}${toChooser}`, { headers: { cookie: cook.cookie } })
      ).text(),
    ).window.document;
    const back = [...chooser.querySelectorAll("a")].find((link) =>
      /Back to the week/.test(link.textContent),
    );
    assert(back, "the chooser offers a way back");
    // Spelled out rather than built with the app's own helper: a verifier that shares
    // the code under test agrees with it even when both are wrong.
    assert.equal(
      back.getAttribute("href"),
      `/planner?week=${week}&day=${day}${view === "week" ? "&view=week" : ""}`,
    );
  }
  pass("the way to the meal chooser and back keeps its place in the week");

  summary("planner view checks passed");
} finally {
  await cleanUp("Disposable planner-view account and its data removed.", (id) =>
    result(admin.from("meal_plans").delete().eq("user_id", id)),
  );
}
