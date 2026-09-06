/**
 * The first thing Zod objected to, in words a person can act on.
 *
 * Nine actions reached into `error.issues[0]?.message` themselves, which means nine
 * places to fix if that shape ever changes and nine chances to forget that `issues`
 * can be empty. The fallback stays a parameter: "Name the list." and "Paste a recipe
 * first." are not interchangeable, and a generic apology helps nobody.
 */
export function firstIssue(
  error: { issues: { message: string }[] },
  fallback: string,
): string {
  return error.issues[0]?.message ?? fallback;
}
