import { Link } from "@heroui/react";

/**
 * The links a footer is obliged to carry.
 *
 * Both footers listed these by hand, so adding a third page — or renaming one — meant
 * remembering there were two lists. There is one now.
 */
export function LegalLinks() {
  return (
    <>
      <Link className="text-xs" href="/privacy">
        Privacy
      </Link>
      <Link className="text-xs" href="/terms">
        Terms
      </Link>
    </>
  );
}
