import type { ReactNode } from "react";
import { cn, Typography } from "@heroui/react";

/**
 * The title block a page opens with.
 *
 * Fourteen pages wrote this out by hand and drifted while doing it: the description
 * was `className="text-muted"` on some pages and `color="muted"` on others, at
 * `body-sm` on six and `body` on two, under a heading whose spacing varied between
 * `gap-1` and `gap-4`. None of that was a decision. The majority spelling wins here so
 * every page's description now reads at the same size and weight.
 *
 * `actions` moves the layout to a row, because a header with something on its right
 * is the only reason any of these were not a simple column.
 */
export function PageHeader({
  actions,
  back,
  className,
  description,
  title,
}: {
  actions?: ReactNode;
  /** A BackLink, when the page is somewhere you arrive from another page. */
  back?: ReactNode;
  className?: string;
  description?: ReactNode;
  title: ReactNode;
}) {
  return (
    <header
      className={cn(
        "flex gap-4",
        actions ? "flex-wrap items-end justify-between" : "flex-col",
        className,
      )}
    >
      <div className="flex max-w-2xl flex-col gap-2">
        {back}
        <Typography type="h1" weight="semibold">
          {title}
        </Typography>
        {description ? (
          <Typography color="muted" type="body-sm">
            {description}
          </Typography>
        ) : null}
      </div>

      {actions}
    </header>
  );
}
