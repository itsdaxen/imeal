import { Skeleton } from "@heroui/react";

import { ContentCard } from "@/components/ui/content-card";
import { PageGrid, span } from "@/components/ui/page-grid";
import { PageHeadingSkeleton } from "@/components/ui/page-skeleton";
import { PageShell } from "@/components/ui/page-shell";

function ShoppingRowSkeleton({ short = false }: { short?: boolean }) {
  return (
    <div className="flex min-h-12 items-center gap-3">
      <Skeleton className="size-5 shrink-0" />
      <Skeleton className={`h-5 ${short ? "w-32" : "w-48 max-w-[55%]"}`} />
      <span className="flex-1" />
      <Skeleton className="size-9 shrink-0" />
    </div>
  );
}

export default function ShoppingLoading() {
  return (
    <PageShell as="div" gap="snug" width="wide">
      <PageHeadingSkeleton actionCount={2} />

      <PageGrid>
        <ContentCard className={`${span.full} gap-0`} density="flush">
          <div className="flex min-h-14 items-center gap-2 border-b border-separator bg-default px-3 py-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-28" />
          </div>

          <div className="flex flex-col gap-4 p-5 sm:p-6">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-24" />
              <div className="flex items-end gap-2 sm:gap-3">
                <Skeleton className="h-11 min-w-0 flex-1" />
                <Skeleton className="h-11 w-24 shrink-0" />
              </div>
              <Skeleton className="h-11 w-40" />
            </div>

            <div className="flex justify-end">
              <Skeleton className="h-9 w-28" />
            </div>

            <div className="flex flex-col">
              <ShoppingRowSkeleton />
              <ShoppingRowSkeleton short />
            </div>

            <div className="flex flex-col gap-1 pt-4">
              <Skeleton className="h-4 w-24" />
              <ShoppingRowSkeleton short />
            </div>

            <Skeleton className="h-4 w-14 self-end" />
          </div>
        </ContentCard>
      </PageGrid>
    </PageShell>
  );
}
