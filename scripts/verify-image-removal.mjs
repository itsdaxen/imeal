// Verifies that removing a recipe photograph never leaves a saved copy pointing at
// bytes that no longer exist.
// Run with: node --env-file=.env.local scripts/verify-image-removal.mjs
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
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

// A one-pixel PNG is enough: the check is about references, not pixels.
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function storePixel(person) {
  const path = `${person.id}/${randomUUID()}.png`;
  await result(
    person.client.storage
      .from("recipe-images")
      .upload(path, PIXEL, { contentType: "image/png" }),
  );
  return {
    path,
    publicUrl: person.client.storage.from("recipe-images").getPublicUrl(path)
      .data.publicUrl,
  };
}

function addRecipe(person, fields) {
  return result(
    person.client
      .from("recipes")
      .insert({
        owner_id: person.id,
        ingredients: ["Salt"],
        steps: ["Cook."],
        prep_minutes: 10,
        servings: 2,
        meal_tags: ["dinner"],
        ...fields,
      })
      .select("id")
      .single(),
  );
}

/** Submits the real edit form, so the server action under test is the one that runs. */
async function submitEdit(person, recipeId, overrides) {
  const path = `/recipes/${recipeId}/edit`;
  const page = await fetch(`${base}${path}`, {
    headers: { cookie: person.cookie },
  });
  assert.equal(page.status, 200);

  const document = new JSDOM(await page.text()).window.document;
  const form = document.querySelector("form");
  assert(form, "Expected the edit form");

  const data = new FormData();
  for (const field of form.querySelectorAll("input[name], textarea[name]")) {
    if (field.type === "checkbox" && !field.checked) continue;
    if (field.type === "file") continue;
    data.set(field.name, field.value);
  }
  assert(
    [...data.keys()].some((name) => name.startsWith("$ACTION_")),
    "Server action is wired into the edit form",
  );
  for (const [name, value] of Object.entries(overrides)) {
    data.set(name, value);
  }

  const response = await fetch(`${base}${path}`, {
    method: "POST",
    body: data,
    redirect: "manual",
    headers: { cookie: person.cookie, origin: new URL(base).origin },
  });
  await response.text();
  assert(response.status < 400, `Edit form returned ${response.status}`);
}

try {
  const owner = await account({
    label: "image-removal-owner",
    name: "owner Probe",
  });
  const other = await account({
    label: "image-removal-other",
    name: "other Probe",
  });
  const photograph = await storePixel(owner);

  const source = await addRecipe(owner, {
    title: "Photographed dish",
    image_url: photograph.publicUrl,
  });
  // Stands in for a saved copy: another account's recipe holding the same URL.
  const copy = await addRecipe(other, {
    title: "Saved copy",
    image_url: photograph.publicUrl,
    source_recipe_id: source.id,
  });

  await submitEdit(owner, source.id, { "remove-image": "on" });

  const stored = await result(
    admin.storage.from("recipe-images").list(owner.id),
  );
  assert.equal(
    stored.some((object) => photograph.path.endsWith(object.name)),
    false,
  );
  pass("the photograph is gone from storage");

  const dangling = await result(
    admin.from("recipes").select("id").eq("image_url", photograph.publicUrl),
  );
  assert.deepEqual(dangling, []);
  pass("no recipe still points at the removed photograph");

  const copied = await result(
    admin.from("recipes").select("image_url, title").eq("id", copy.id).single(),
  );
  assert.equal(copied.image_url, null);
  assert.equal(copied.title, "Saved copy");
  pass("the saved copy keeps its recipe, without a broken photograph");

  const intruder = await storePixel(other);
  const ownRecipe = await addRecipe(owner, {
    title: "Points at someone else",
    image_url: intruder.publicUrl,
  });
  await submitEdit(owner, ownRecipe.id, { "remove-image": "on" });

  const intact = await result(
    admin.storage.from("recipe-images").list(other.id),
  );
  assert.equal(
    intact.some((object) => intruder.path.endsWith(object.name)),
    true,
  );
  pass("a photograph stored by someone else is left alone");

  summary("image removal checks passed");
} finally {
  await cleanUp("Disposable image-removal accounts and their data removed.");
}
