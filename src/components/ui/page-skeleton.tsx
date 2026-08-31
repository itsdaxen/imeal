import { Skeleton } from "@heroui/react";

import { ContentCard } from "./content-card";

/**
 * A loading screen is a promise about the page that follows, so these pieces exist
 * to be arranged into the real geometry rather than to stand in for any page.
 */
export function PageHeadingSkeleton({ action = true }: { action?: boolean }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      {action ? <Skeleton className="h-11 w-36 rounded-full" /> : null}
    </header>
  );
}

export function CardSkeleton({
  className,
  lines = 3,
  media,
}: {
  className?: string;
  lines?: number;
  media?: boolean;
}) {
  return (
    <ContentCard className={className} density="compact">
      {media ? <Skeleton className="h-36 w-full rounded-lg" /> : null}
      <div className="flex flex-col gap-2 p-1">
        <Skeleton className="h-5 w-3/4" />
        {Array.from({ length: lines - 1 }, (_, index) => (
          <Skeleton className="h-3.5 w-1/2" key={index} />
        ))}
      </div>
    </ContentCard>
  );
}

/** `rows` is a line count, so the height has to be computed rather than a class. */
export function FieldSkeleton({ rows = 1 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton
        className="w-full"
        style={{ height: rows > 1 ? `${rows * 1.5 + 1}rem` : "2.75rem" }}
      />
    </div>
  );
}
