import { Link } from "@heroui/react";

export function AppFooter() {
  return (
    <footer className="mt-14 flex flex-col gap-2 border-t border-separator py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
      <span>
        © {new Date().getFullYear()}{" "}
        <span className="font-brand text-base">iMeal</span>. All rights
        reserved.
      </span>
      <span className="flex flex-wrap items-center gap-4">
        <Link className="text-xs" href="/privacy">
          Privacy
        </Link>
        <Link className="text-xs" href="/terms">
          Terms
        </Link>
        <Link
          className="text-xs"
          href="https://thedaxen.com/"
          rel="noreferrer"
          target="_blank"
        >
          Built by thedaxen
        </Link>
      </span>
    </footer>
  );
}
