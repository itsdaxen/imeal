import type { ReactNode } from "react";

import { Typography } from "@heroui/react";

import { ContentCard } from "./content-card";

type EmptyStateProps = {
  actions?: ReactNode;
  /** Drops the surface where this already sits inside a panel of its own. */
  bare?: boolean;
  /** Only where it says something the title does not — usually the way out. */
  description?: ReactNode;
  icon: ReactNode;
  /**
   * `1` where this is the whole page's message, which is the recovery screens.
   * Inside a page that already has a heading it has to step down to `2`.
   */
  level?: 1 | 2;
  title: string;
};

/** A stable recovery surface for empty, missing, and unavailable content. */
export function EmptyState({
  actions,
  bare,
  description,
  icon,
  level = 2,
  title,
}: EmptyStateProps) {
  const content = (
    <>
      <span
        aria-hidden="true"
        className="grid size-14 place-items-center rounded-xl bg-surface-secondary text-muted"
      >
        {icon}
      </span>
      {/* Typography sets its own text-align, so inheriting it here never wins. */}
      <div className="flex flex-col gap-2">
        <Typography
          className="text-center"
          type={level === 1 ? "h1" : "h2"}
          weight="semibold"
        >
          {title}
        </Typography>
        {description ? (
          <Typography className="text-center" color="muted" type="body">
            {description}
          </Typography>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actions}
        </div>
      ) : null}
    </>
  );

  if (bare) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-5 py-10 text-center">
        {content}
      </div>
    );
  }

  return (
    <ContentCard
      className="mx-auto w-full max-w-xl items-center gap-5 py-12 text-center sm:py-16"
      density="spacious"
    >
      {content}
    </ContentCard>
  );
}
