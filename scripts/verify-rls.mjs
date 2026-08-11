// Proves the access matrix in supabase/migrations/*_core_policies.sql against a real
// database. Creates two throwaway users, exercises every policy boundary, and deletes
// them again. Needs a real project and the service key, so it is deliberately outside
// `pnpm check`.
//
//   set -a; . ./.env.local; set +a && pnpm verify:rls

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const admin = createClient(url, process.env.SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const results = [];
const check = (name, pass, detail = "") => results.push({ name, pass, detail });

async function makeUser(tag) {
  const email = `rls-${tag}-${Date.now()}@example.test`;
  const password = "Test-Password-123!";
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(`createUser ${tag}: ${error.message}`);
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) throw new Error(`signIn ${tag}: ${signInError.message}`);
  return { id: data.user.id, client };
}

const a = await makeUser("a");
const b = await makeUser("b");
const anon = createClient(url, anonKey);

try {
  // The auth trigger must have created both the profile and the default role.
  const { data: prof } = await admin
    .from("profiles")
    .select("id")
    .eq("id", a.id)
    .single();
  check("signup trigger creates a profile", prof?.id === a.id);
  const { data: role } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", a.id)
    .single();
  check("signup trigger grants the user role", role?.role === "user");

  // Anonymous
  const { data: anonProfiles } = await anon.from("profiles").select("id");
  check("anonymous cannot read profiles", (anonProfiles ?? []).length === 0);
  const { error: anonRecipeError } = await anon.from("recipes").select("id");
  check("anonymous may read the catalog", !anonRecipeError);

  // Owner writes
  const { data: recipe, error: recipeError } = await a.client
    .from("recipes")
    .insert({ owner_id: a.id, title: "Owner recipe" })
    .select()
    .single();
  check("owner creates a private recipe", !recipeError, recipeError?.message);

  const { data: plan, error: planError } = await a.client
    .from("meal_plans")
    .insert({ user_id: a.id, week_start: "2026-08-10" })
    .select()
    .single();
  check("owner creates a meal plan", !planError, planError?.message);

  // Cross-user isolation
  const { data: bSeesRecipe } = await b.client
    .from("recipes")
    .select("id")
    .eq("id", recipe?.id ?? "");
  check(
    "other user cannot read a private recipe",
    (bSeesRecipe ?? []).length === 0,
  );
  const { data: bSeesPlan } = await b.client
    .from("meal_plans")
    .select("id")
    .eq("id", plan?.id ?? "");
  check("other user cannot read a meal plan", (bSeesPlan ?? []).length === 0);

  const { error: bWriteError } = await b.client.from("meal_plan_items").insert({
    meal_plan_id: plan?.id,
    recipe_id: recipe?.id,
    day_index: 0,
    slot: "dinner",
  });
  check(
    "other user cannot write into someone's plan",
    !!bWriteError,
    bWriteError?.message,
  );

  // Privilege escalation — the legacy app's worst risk
  const { error: escalateError } = await a.client
    .from("user_roles")
    .insert({ user_id: a.id, role: "admin" });
  check(
    "user cannot grant themselves admin",
    !!escalateError,
    escalateError?.message,
  );

  const { error: publicRecipeError } = await a.client.from("recipes").insert({
    owner_id: null,
    title: "Sneaky catalog entry",
    visibility: "public",
  });
  check(
    "non-admin cannot publish to the catalog",
    !!publicRecipeError,
    publicRecipeError?.message,
  );

  // Ownership cannot be reassigned to another user
  const { data: stolen } = await b.client
    .from("recipes")
    .update({ title: "stolen" })
    .eq("id", recipe?.id ?? "")
    .select();
  check(
    "other user cannot update a private recipe",
    (stolen ?? []).length === 0,
  );

  const { error: ownProfileError } = await a.client
    .from("profiles")
    .update({ display_name: "Owner" })
    .eq("id", a.id);
  check(
    "owner updates their own profile",
    !ownProfileError,
    ownProfileError?.message,
  );
} finally {
  await admin.auth.admin.deleteUser(a.id);
  await admin.auth.admin.deleteUser(b.id);
}

let failed = 0;
for (const r of results) {
  if (!r.pass) failed++;
  console.log(
    `${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.pass ? "" : "  <- " + r.detail}`,
  );
}
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
