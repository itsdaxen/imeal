// Pressing Organize on a real list, and reading what comes back.
// Run with: node --env-file=.env.local scripts/verify-tidy-flow.mjs
//
// The pieces are checked elsewhere: the model by `pnpm eval`, the write by
// `verify:tidy`. What only this can show is the join — a signed-in member, their own
// rows, the real action — so it costs a model call and makes one pass rather than a
// suite. Applying is left to `verify:tidy`: the form that does it is built in the
// browser, so there is no honest way to press it from here.
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import {
  account,
  base,
  cleanUp,
  pass,
  result,
  summary,
} from "./lib/harness.mjs";

const MESSY = [
  { name: "Tomato", quantity: 2 },
  { name: "tomatoes", quantity: 3 },
  { name: "fresh basil", quantity: 1, unit: "bunch" },
  { name: "dried basil", quantity: 1, unit: "jar" },
  { name: "loo roll", quantity: 1 },
];

/** Reads a whole server action reply, which a dev server leaves open. */
async function replyOf(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  const deadline = Date.now() + 8000;

  while (Date.now() < deadline && text.length < 400_000) {
    const chunk = await Promise.race([
      reader.read(),
      new Promise((resolve) => setTimeout(() => resolve({ done: true }), 2500)),
    ]);
    if (chunk.done) break;
    text += decoder.decode(chunk.value, { stream: true });
  }

  await reader.cancel();
  return text;
}

/**
 * Digs the proposal out of a server action's reply.
 *
 * The reply is a stream of React's own encoding rather than JSON, and the proposal
 * sits inside it as an escaped string, so it is found by its shape: unescape, look
 * for the object, and balance the brackets to its end.
 */
function proposalIn(reply) {
  const plain = reply.replaceAll('\\"', '"');
  const start = plain.indexOf('{"items":[{"sourceIds"');

  if (start === -1) return null;

  let depth = 0;

  for (let at = start; at < plain.length; at += 1) {
    if (plain[at] === "{") depth += 1;
    if (plain[at] === "}") {
      depth -= 1;

      if (depth === 0) {
        try {
          return JSON.parse(plain.slice(start, at + 1));
        } catch {
          return null;
        }
      }
    }
  }

  return null;
}

async function submit(user, form, path, extra = {}) {
  const data = new FormData();
  for (const input of form.querySelectorAll("input[name]")) {
    data.set(input.name, input.value);
  }
  for (const [name, value] of Object.entries(extra)) data.set(name, value);
  assert(
    [...data.keys()].some((name) => name.startsWith("$ACTION_")),
    "the form carries a server action",
  );

  const response = await fetch(`${base}${path}`, {
    method: "POST",
    body: data,
    redirect: "manual",
    headers: { cookie: user.cookie, origin: new URL(base).origin },
  });
  assert(response.status < 400, `the form returned ${response.status}`);

  return replyOf(response);
}

try {
  const cook = await account({ label: "tidy-flow", name: "Rosa Flow" });
  const list = await result(
    cook.client
      .from("shopping_lists")
      .select("id")
      .eq("owner_id", cook.id)
      .limit(1)
      .single(),
  ).then((row) => row.id);

  for (const fields of MESSY) {
    await result(
      cook.client.from("shopping_items").insert({
        list_id: list,
        user_id: cook.id,
        source: "manual",
        ...fields,
      }),
    );
  }

  const page = new JSDOM(
    await (
      await fetch(`${base}/shopping?list=${list}`, {
        headers: { cookie: cook.cookie },
      })
    ).text(),
  ).window.document;
  const organizeForm = [...page.forms].find((form) =>
    /Organize list/.test(form.textContent),
  );
  assert(organizeForm, "the shopping page offers to organize the list");
  pass("the list offers to be organized");

  const proposed = await submit(cook, organizeForm, `/shopping?list=${list}`);
  const proposal = proposalIn(proposed);
  assert(proposal, "the reply carries a proposal");

  const sourceIds = proposal.items.flatMap((entry) => entry.sourceIds);
  assert.equal(new Set(sourceIds).size, MESSY.length);
  assert.equal(sourceIds.length, MESSY.length);
  pass("pressing it returns a proposal accounting for every row once");

  assert(
    proposal.items.some((entry) => entry.sourceIds.length > 1),
    "nothing was combined, though the list says tomato twice",
  );
  pass("and it combines the list's two spellings of the same thing");

  const rows = await result(
    cook.client.from("shopping_items").select("id").eq("list_id", list),
  );
  assert.equal(rows.length, MESSY.length);
  pass("proposing on its own changes nothing until it is accepted");

  summary("tidy flow checks passed");
} finally {
  await cleanUp("Disposable tidy-flow account and its list removed.");
}
