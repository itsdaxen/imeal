import { Skeleton } from "@heroui/react";

import { ContentCard } from "@/components/ui/content-card";
import { PageShell } from "@/components/ui/page-shell";

export default function ShoppingLoading() {
  return (
    <PageShell as="div" gap="snug">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Skeleton className="h-11 w-28" />
          <Skeleton className="h-11 w-24" />
          <Skeleton className="size-11" />
        </div>
        <div className="flex gap-1">
          <Skeleton className="size-11" />
          <Skeleton className="size-11" />
        </div>
      </div>

      <ContentCard>
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-9 w-56 rounded-lg" />
        <div className="flex flex-col gap-1">
          {[0, 1, 2, 3, 4].map((row) => (
            <Skeleton className="h-12 w-full" key={row} />
          ))}
        </div>
      </ContentCard>
    </PageShell>
  );
}
