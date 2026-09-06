/**
 * How this app decides two names are the same name.
 *
 * Case and space are noise: rows come from recipes, from staples and from whatever
 * someone typed into the box, and "Sea Salt" arriving beside "  sea salt " is a list
 * that looks broken. Space *inside* the name counts too — a real list had
 * "  olive   oil " on it, which survived a trim and so did not match the "Olive oil"
 * staple, and the list grew a second olive oil. Locale-aware lowering, so it is right
 * for more alphabets.
 */
export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

/**
 * Which of these names are not already present.
 *
 * Three places asked this — adding a meal's ingredients, adding staples, approving a
 * meal — and they had answered it differently: one skipped the `trim`, so a staple
 * stored as " Salt " was added again beside the "Salt" already there; another did not
 * guard against the same name appearing twice in its own input. The strictest of the
 * three is the correct one, so it is the only one now.
 *
 * The caller's own spelling is what gets returned: matching is case-insensitive, but a
 * list should show the name as the person who added it writes it.
 */
export function namesToAdd(candidates: string[], existing: string[]): string[] {
  const present = new Set(existing.map(normalizeName));
  const added: string[] = [];

  for (const candidate of candidates) {
    const key = normalizeName(candidate);

    if (!key || present.has(key)) {
      continue;
    }

    present.add(key);
    added.push(candidate);
  }

  return added;
}
