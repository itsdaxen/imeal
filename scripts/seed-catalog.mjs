import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { catalogRecipes } from "./catalog/recipes.mjs";

const recipeSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(1).max(200),
  prepMinutes: z.number().int().min(1).max(1440),
  servings: z.number().int().min(1).max(100),
  mealTags: z.array(z.enum(["breakfast", "lunch", "snack", "dinner"])).min(1),
  collectionTags: z.array(z.string().trim().min(1).max(40)).max(12),
  ingredients: z.array(z.string().trim().min(1).max(200)).min(1),
  steps: z.array(z.string().trim().min(1).max(2000)).min(1),
  tip: z.string().trim().min(1).max(500),
});

const apply = process.argv.includes("--apply");
const parsed = z.array(recipeSchema).length(60).parse(catalogRecipes);
assert.equal(
  new Set(parsed.map((entry) => entry.slug)).size,
  parsed.length,
  "Catalog slugs must be unique.",
);
assert.equal(
  new Set(parsed.map((entry) => entry.title)).size,
  parsed.length,
  "Catalog titles must be unique.",
);

const counts = Object.fromEntries(
  ["breakfast", "lunch", "snack", "dinner"].map((tag) => [
    tag,
    parsed.filter((entry) => entry.mealTags.includes(tag)).length,
  ]),
);

if (!apply) {
  console.log(
    JSON.stringify(
      { mode: "validate", recipes: parsed.length, mealTagCounts: counts },
      null,
      2,
    ),
  );
  process.exit(0);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
assert(
  url && serviceKey,
  "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are required.",
);

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const here = path.dirname(fileURLToPath(import.meta.url));

for (const entry of parsed) {
  const image = await readFile(
    path.join(here, "catalog", "images", `${entry.slug}.webp`),
  );
  const objectPath = `catalog/${entry.slug}.webp`;
  const { error: uploadError } = await supabase.storage
    .from("recipe-images")
    .upload(objectPath, image, { contentType: "image/webp", upsert: true });
  if (uploadError) throw uploadError;

  const { data: publicImage } = supabase.storage
    .from("recipe-images")
    .getPublicUrl(objectPath);
  const values = {
    catalog_seed_key: entry.slug,
    owner_id: null,
    visibility: "public",
    status: "active",
    title: entry.title,
    ingredients: entry.ingredients,
    steps: entry.steps,
    tip: entry.tip,
    prep_minutes: entry.prepMinutes,
    servings: entry.servings,
    meal_tags: entry.mealTags,
    collection_tags: entry.collectionTags,
    image_url: publicImage.publicUrl,
  };
  const { error } = await supabase
    .from("recipes")
    .upsert(values, { onConflict: "catalog_seed_key" });
  if (error) throw error;
}

const { data, error } = await supabase
  .from("recipes")
  .select("catalog_seed_key, image_url, ingredients, steps")
  .in(
    "catalog_seed_key",
    parsed.map((entry) => entry.slug),
  );
if (error) throw error;
assert.equal(data.length, parsed.length);
for (const row of data) {
  assert(row.image_url);
  assert(row.ingredients.length > 0);
  assert(row.steps.length > 0);
}

console.log(
  JSON.stringify(
    { mode: "apply", recipes: data.length, mealTagCounts: counts },
    null,
    2,
  ),
);
