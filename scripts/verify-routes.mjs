// Renders every route as a real signed-in user and asserts the status.
//
// Every other check in this project runs below the page: policies, queries, schemas.
// This one proves the pages themselves render, which is the gap that let a stale dev
// server look like a broken application. Needs the app running and a real project,
// so it is deliberately outside `pnpm check`.
//
//   pnpm dev &
//   set -a; . ./.env.local; set +a && pnpm verify:routes

import { createClient } from "@supabase/supabase-js";

const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const service = process.env.SUPABASE_SERVICE_KEY;

if (!url || !anon || !service) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

// Signed out, every protected route redirects; the two auth screens do not.
const SIGNED_OUT = [
  ["/", 307],
  ["/planner", 307],
  ["/shopping", 307],
  ["/recipes", 307],
  ["/friends", 307],
  ["/profile", 307],
  ["/sign-in", 200],
  ["/sign-up", 200],
];

// Signed in as an ordinary user. Moderation is 404 because they are not an admin.
const SIGNED_IN = [
  ["/", 200],
  ["/planner", 200],
  ["/planner/assign?day=0&slot=dinner", 200],
  ["/shopping", 200],
  ["/shopping/staples", 200],
  ["/recipes", 200],
  ["/recipes/new", 200],
  ["/recipes/shared", 200],
  ["/catalog", 200],
  ["/friends", 200],
  ["/profile", 200],
  ["/admin", 404],
  ["/sign-in", 307],
];

const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function reachable() {
  try {
    await fetch(`${BASE}/sign-in`, { redirect: "manual" });
    return true;
  } catch {
    return false;
  }
}

if (!(await reachable())) {
  console.error(
    `Nothing is serving ${BASE}. Start the app with \`pnpm dev\` first.`,
  );
  process.exit(1);
}

const email = `routes-${Date.now()}@example.test`;
const password = "Test-Password-123!";
const { data: created, error: createError } = await admin.auth.admin.createUser(
  {
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: "Route Probe" },
  },
);

if (createError) {
  console.error(`Could not create the probe user: ${createError.message}`);
  process.exit(1);
}

const results = [];

try {
  const client = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: session, error: signInError } =
    await client.auth.signInWithPassword({ email, password });

  if (signInError) {
    throw new Error(`Could not sign in the probe user: ${signInError.message}`);
  }

  // @supabase/ssr stores the session as a base64- prefixed cookie, chunked when long.
  const ref = new URL(url).hostname.split(".")[0];
  const encoded =
    "base64-" +
    Buffer.from(JSON.stringify(session.session)).toString("base64url");
  const CHUNK = 3180;
  const jar =
    encoded.length <= CHUNK
      ? [[`sb-${ref}-auth-token`, encoded]]
      : Array.from({ length: Math.ceil(encoded.length / CHUNK) }, (_, i) => [
          `sb-${ref}-auth-token.${i}`,
          encoded.slice(i * CHUNK, (i + 1) * CHUNK),
        ]);
  const cookie = jar.map(([name, value]) => `${name}=${value}`).join("; ");

  const probe = async (path, expected, headers) => {
    const response = await fetch(`${BASE}${path}`, {
      headers,
      redirect: "manual",
    });
    results.push({
      label: `${headers ? "in " : "out"} ${path}`,
      pass: response.status === expected,
      detail: `expected ${expected}, got ${response.status}`,
    });
  };

  for (const [path, expected] of SIGNED_OUT) {
    await probe(path, expected);
  }

  for (const [path, expected] of SIGNED_IN) {
    await probe(path, expected, { cookie });
  }
} finally {
  await admin.auth.admin.deleteUser(created.user.id);
}

let failed = 0;

for (const result of results) {
  if (!result.pass) failed++;
  console.log(
    `${result.pass ? "PASS" : "FAIL"}  ${result.label}${result.pass ? "" : `  <- ${result.detail}`}`,
  );
}

console.log(
  `\n${results.length - failed}/${results.length} routes render as expected`,
);
process.exit(failed ? 1 : 0);
