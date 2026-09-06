// Creates a real cooking fixture and verifies the server-rendered route.
// Run with: node --env-file=.env.local scripts/verify-cooking.mjs
// Add --browser to keep the fixture until Enter is pressed for visual review.
import assert from "node:assert/strict";

import { JSDOM } from "jsdom";

import {
  account,
  base,
  cleanUp,
  holdForReview,
  pass,
  result,
} from "./lib/harness.mjs";

try {
  const cook = await account({ label: "cooking", name: "Cooking Probe" });
  const recipe = await result(
    cook.client
      .from("recipes")
      .insert({
        owner_id: cook.id,
        title: "Tomato pasta for browser review",
        ingredients: [
          "320 g dried spaghetti",
          "800 g whole peeled tomatoes",
          "4 garlic cloves, thinly sliced",
          "A generous handful of basil leaves",
          "Extra-virgin olive oil, salt, and black pepper",
        ],
        steps: [
          "Bring a large pot of well-salted water to a rolling boil.",
          "Warm the olive oil and garlic gently until the garlic is fragrant but not browned.",
          "Crush in the tomatoes, season, and simmer until glossy and slightly reduced.",
          "Cook the spaghetti until just shy of al dente, then transfer it into the sauce with a splash of pasta water.",
          "Toss until the sauce clings to every strand, fold through the basil, and serve immediately.",
        ],
        tip: "Keep a mug of pasta water nearby; its starch helps the sauce turn silky.",
        prep_minutes: 35,
        servings: 4,
      })
      .select("id")
      .single(),
  );
  const path = `/cook/${recipe.id}`;
  const response = await fetch(`${base}${path}`, {
    headers: { cookie: cook.cookie },
  });
  const document = new JSDOM(await response.text()).window.document;
  assert.equal(response.status, 200);
  assert.equal(
    document.querySelector("h1")?.textContent,
    "Tomato pasta for browser review",
  );
  assert.match(document.body.textContent, /Elapsed time/);
  assert.match(document.body.textContent, /Keep a mug of pasta water nearby/);
  pass("cooking route renders the complete workspace");

  await holdForReview([
    `Browser fixture: ${cook.email}`,
    `Password: ${cook.password}`,
    `Cooking URL: ${base}${path}`,
  ]);
} finally {
  await cleanUp("Disposable cooking account and its data removed.");
}
