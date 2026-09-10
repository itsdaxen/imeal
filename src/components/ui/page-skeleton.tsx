import { Skeleton } from "@heroui/react";

import { CardGrid } from "./card-grid";
import { ContentCard } from "./content-card";

/**
 * A loading screen is a promise about the page that follows, so these pieces exist
 * to be arranged into the real geometry rather than to stand in for any page.
 */
export function PageHeadingSkeleton({
  action = true,
  actionCount,
  back = false,
  description = true,
}: {
  action?: boolean;
  actionCount?: number;
  back?: boolean;
  description?: boolean;
}) {
  const actions = actionCount ?? (action ? 1 : 0);

  return (
    <header
      className={`flex gap-4 ${actions > 0 ? "flex-wrap items-end justify-between" : "flex-col"}`}
    >
      <div className="flex max-w-2xl flex-col gap-2">
        {back ? <Skeleton className="h-5 w-28" /> : null}
        <Skeleton className="h-9 w-56" />
        {description ? <Skeleton className="h-4 w-72 max-w-full" /> : null}
      </div>
      {actions > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: actions }, (_, index) => (
            <Skeleton className="h-11 w-32" key={index} />
          ))}
        </div>
      ) : null}
    </header>
  );
}

/** The search field and collapsed filter trigger shared by recipe collections. */
export function SearchFiltersSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-11 w-full" />
      </div>
      <div className="flex min-h-11 items-center justify-between px-3">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="size-4" />
      </div>
    </div>
  );
}

function CardSkeleton({
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
      {media ? <Skeleton className="h-36 w-full rounded-xl" /> : null}
      <div className="flex flex-col gap-2 p-1">
        <Skeleton className="h-5 w-3/4" />
        {Array.from({ length: lines - 1 }, (_, index) => (
          <Skeleton className="h-3.5 w-1/2" key={index} />
        ))}
      </div>
    </ContentCard>
  );
}

export function RecipeGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <CardGrid>
      {Array.from({ length: count }, (_, index) => (
        <li key={index}>
          <CardSkeleton className="h-full" media />
        </li>
      ))}
    </CardGrid>
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
