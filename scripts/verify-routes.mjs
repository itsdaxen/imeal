// Renders every route as a real signed-in user and asserts the status.
//
// Every other check in this project runs below the page: policies, queries, schemas.
// This one proves the pages themselves render, which is the gap that let a stale dev
// server look like a broken application. Needs the app running and a real project,
// so it is deliberately outside `pnpm check`.
//
//   pnpm dev &
//   set -a; . ./.env.local; set +a && pnpm verify:routes

import { account, cleanUp } from "./lib/harness.mjs";

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
  ["/recipes/import", 307],
  ["/friends", 307],
  ["/friends/invites", 307],
  ["/profile", 307],
  ["/sign-in", 200],
  ["/sign-up", 200],
  ["/forgot-password", 200],
  ["/robots.txt", 200],
  ["/reset-password", 307],
];

// Signed in as an ordinary user. Moderation is 404 because they are not an admin.
const SIGNED_IN = [
  ["/", 200],
  ["/planner", 200],
  ["/planner/assign?day=0&slot=dinner", 200],
  ["/shopping", 200],
  ["/shopping/staples", 200],
  ["/recipes", 200],
  ["/recipes/import", 200],
  ["/recipes/new", 200],
  ["/recipes/shared", 200],
  ["/catalog", 200],
  ["/friends", 200],
  ["/friends/invites", 200],
  ["/profile", 200],
  ["/admin", 404],
  ["/sign-in", 307],
  ["/forgot-password", 200],
  ["/reset-password", 200],
  ["/privacy", 200],
  ["/terms", 200],
];

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

// The shared helper, rather than a hand-rolled account: it is the one place that
// knows a new sign-up now lands in first-run setup, and a probe that does not know
// reports every app route as a redirect.
const probeUser = await account({ label: "routes", name: "Route Probe" });

const results = [];

try {
  const cookie = probeUser.cookie;

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

    // A page is for one thing. Two primary actions means the page has not decided
    // which, and that is a judgement no test but this one can make.
    if (response.status === 200) {
      const html = await response.text();
      const primaries = html.match(/data-action-tier="primary"/g)?.length ?? 0;
      results.push({
        label: `${headers ? "in " : "out"} ${path} — one primary action`,
        pass: primaries <= 1,
        detail: `found ${primaries}`,
      });
    }
  };

  for (const [path, expected] of SIGNED_OUT) {
    await probe(path, expected);
  }

  for (const [path, expected] of SIGNED_IN) {
    await probe(path, expected, { cookie });
  }
} finally {
  await cleanUp("Disposable route probe removed.");
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
