import { Skeleton } from "@heroui/react";

import { ContentCard } from "@/components/ui/content-card";
import { PageHeadingSkeleton } from "@/components/ui/page-skeleton";
import { PageShell } from "@/components/ui/page-shell";

export default function PlannerLoading() {
  return (
    <PageShell as="div">
      <PageHeadingSkeleton />
      <Skeleton className="h-16 w-full" />

      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-7 xl:gap-3">
        {[0, 1, 2, 3, 4, 5, 6].map((day) => (
          <ContentCard className="h-full" density="compact" key={day}>
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-3.5 w-16" />
            <div className="flex flex-col gap-3 xl:gap-2">
              {[0, 1, 2].map((slot) => (
                <Skeleton className="h-14 w-full" key={slot} />
              ))}
            </div>
          </ContentCard>
        ))}
      </div>
    </PageShell>
  );
}
