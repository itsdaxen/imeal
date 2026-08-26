// Creates a real cooking fixture and verifies the server-rendered route.
// Run with: node --env-file=.env.local scripts/verify-cooking.mjs
// Add --browser to keep the fixture until Enter is pressed for visual review.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { createClient } from "@supabase/supabase-js";
import { JSDOM } from "jsdom";

const base = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const service = process.env.SUPABASE_SERVICE_KEY;
assert(url && key && service, "Missing Supabase environment variables.");

const options = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(url, service, options);
const email = `cooking-${randomUUID()}@example.test`;
const password = "Cooking-Probe-123!";
let userId;

async function result(request) {
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return data;
}

try {
  const { user } = await result(
    admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: "Cooking Probe" },
    }),
  );
  userId = user.id;
  const client = createClient(url, key, options);
  const { session } = await result(
    client.auth.signInWithPassword({ email, password }),
  );
  const recipe = await result(
    client
      .from("recipes")
      .insert({
        owner_id: user.id,
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
  const encoded =
    "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url");
  const prefix = `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
  const cookie = Array.from(
    { length: Math.ceil(encoded.length / 3180) },
    (_, index) =>
      `${prefix}${encoded.length > 3180 ? `.${index}` : ""}=${encoded.slice(index * 3180, (index + 1) * 3180)}`,
  ).join("; ");
  const path = `/cook/${recipe.id}`;
  const response = await fetch(`${base}${path}`, { headers: { cookie } });
  const document = new JSDOM(await response.text()).window.document;
  assert.equal(response.status, 200);
  assert.equal(
    document.querySelector("h1")?.textContent,
    "Tomato pasta for browser review",
  );
  assert.match(document.body.textContent, /Elapsed time/);
  assert.match(document.body.textContent, /Keep a mug of pasta water nearby/);
  console.log("PASS cooking route renders the complete workspace");

  if (process.argv.includes("--browser")) {
    console.log(`Browser fixture: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Cooking URL: ${base}${path}`);
    const terminal = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    await terminal.question("Press Enter when browser review is complete: ");
    terminal.close();
  }
} finally {
  if (userId) await result(admin.auth.admin.deleteUser(userId));
  console.log("Disposable cooking account and its data removed.");
}
