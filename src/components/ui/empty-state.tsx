import type { ReactNode } from "react";

import { Typography } from "@heroui/react";

import { ContentCard } from "./content-card";

type EmptyStateProps = {
  actions?: ReactNode;
  description: ReactNode;
  icon: ReactNode;
  title: string;
};

/** A stable recovery surface for empty, missing, and unavailable content. */
export function EmptyState({
  actions,
  description,
  icon,
  title,
}: EmptyStateProps) {
  return (
    <ContentCard
      className="mx-auto w-full max-w-xl items-center gap-5 py-12 text-center sm:py-16"
      density="spacious"
    >
      <span
        aria-hidden="true"
        className="grid size-14 place-items-center rounded-2xl bg-surface-secondary text-muted"
      >
        {icon}
      </span>
      <div className="flex flex-col gap-2">
        <Typography type="h1" weight="semibold">
          {title}
        </Typography>
        <Typography color="muted" type="body">
          {description}
        </Typography>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actions}
        </div>
      ) : null}
    </ContentCard>
  );
}
