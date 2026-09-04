/**
 * A person's initials, for when there is no photograph.
 *
 * This existed twice with quietly different rules — one used `toUpperCase`, the
 * other `toLocaleUpperCase` — so the same name could render differently depending on
 * which component drew it. Locale-aware wins: it is correct for more alphabets.
 */
export function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toLocaleUpperCase() ?? "")
      .join("") || "?"
  );
}

/**
 * Escapes a user's search term for `ilike`.
 *
 * PostgREST treats `%` and `_` as wildcards, so a search for "100%" would otherwise
 * match far more than it should. Every search box needs this, and forgetting it is
 * silent — the query still runs, it just answers the wrong question.
 */
export function escapeLikePattern(value: string): string {
  return value.replace(/[%_\\]/g, (match) => `\\${match}`);
}
