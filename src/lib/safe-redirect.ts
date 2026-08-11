const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

// `startsWith("/")` is not enough: browsers read "//host" and "/\\host" as
// protocol-relative URLs and follow them off-site.
export function safeInternalPath(
  value: string | null | undefined,
  fallback: string,
): string {
  if (!value || !value.startsWith("/")) {
    return fallback;
  }

  if (value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  if (CONTROL_CHARACTERS.test(value)) {
    return fallback;
  }

  return value;
}
