// Generation replaces a week, and the default shopping list survives direct API use.
// Run with: node --env-file=.env.local scripts/verify-plan-replacement.mjs
import assert from "node:assert/strict";

import {
  account,
  admin,
  cleanUp,
  pass,
  result,
  summary,
} from "./lib/harness.mjs";

const week = "2026-09-14";

try {
  const cook = await account({ label: "replace-plan", name: "Rosa Replace" });
  const recipes = await result(
    cook.client
      .from("recipes")
      .insert([
        {
          title: "Old dinner",
          owner_id: cook.id,
          ingredients: ["Old ingredient"],
          meal_tags: ["dinner"],
        },
        {
          title: "New dinner",
          owner_id: cook.id,
          ingredients: ["New ingredient"],
          meal_tags: ["dinner"],
        },
      ])
      .select("id, title"),
  );
  const oldRecipe = recipes.find((recipe) => recipe.title === "Old dinner");
  const newRecipe = recipes.find((recipe) => recipe.title === "New dinner");
  assert(oldRecipe && newRecipe);

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
      recipe_id: oldRecipe.id,
      day_index: 0,
      slot_index: 3,
      slot: "dinner",
      approved: true,
    }),
  );

  await result(
    cook.client.rpc("apply_generated_plan", {
      p_week_start: week,
      p_slots: ["dinner"],
      p_assignments: [
        {
          recipeId: newRecipe.id,
          dayIndex: 0,
          slotIndex: 0,
          slot: "dinner",
        },
      ],
    }),
  );
  const meals = await result(
    cook.client
      .from("meal_plan_items")
      .select("recipe_id, approved")
      .eq("meal_plan_id", plan.id),
  );
  assert.deepEqual(meals, [{ recipe_id: newRecipe.id, approved: false }]);
  pass("generating replaces approved and unapproved meals from the old plan");

  const defaultList = await result(
    cook.client
      .from("shopping_lists")
      .select("id")
      .eq("owner_id", cook.id)
      .eq("is_default", true)
      .single(),
  );
  await result(
    cook.client.from("shopping_lists").delete().eq("id", defaultList.id),
  );
  const survivingDefault = await result(
    cook.client
      .from("shopping_lists")
      .select("id")
      .eq("id", defaultList.id)
      .single(),
  );
  assert.equal(survivingDefault.id, defaultList.id);
  pass("the default list cannot be deleted through the Data API");

  summary("plan replacement checks passed");
} finally {
  await cleanUp("Disposable replacement account and its data removed.", (id) =>
    result(admin.from("meal_plans").delete().eq("user_id", id)),
  );
}
