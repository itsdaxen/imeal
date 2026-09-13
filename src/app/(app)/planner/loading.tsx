import { Skeleton } from "@heroui/react";

import { ContentCard } from "@/components/ui/content-card";
import { PageHeadingSkeleton } from "@/components/ui/page-skeleton";
import { PageShell } from "@/components/ui/page-shell";

export default function PlannerLoading() {
  return (
    <PageShell as="div">
      <PageHeadingSkeleton />

      <div className="flex items-center justify-center gap-3">
        <Skeleton className="h-11 w-32" />
        <Skeleton className="h-11 w-44" />
      </div>

      <ContentCard className="w-full" density="flush">
        <Skeleton className="h-11 w-full" />
      </ContentCard>

      {/* A day at a time, at every width, because that is what the planner opens as.
          Showing seven columns here would flash a week that then collapses to one. */}
      <div className="hidden justify-end xl:flex">
        <Skeleton className="h-9 w-40" />
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-7 gap-1">
          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
            <Skeleton className="h-14 w-full" key={day} />
          ))}
        </div>
        <DaySkeleton />
      </div>

      <div className="flex items-center justify-center gap-6">
        {[0, 1, 2].map((item) => (
          <Skeleton className="h-5 w-16" key={item} />
        ))}
      </div>
    </PageShell>
  );
}

function DaySkeleton() {
  return (
    <ContentCard className="h-full" density="compact">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-3.5 w-16" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2].map((slot) => (
          <Skeleton className="h-24 w-full" key={slot} />
        ))}
      </div>
    </ContentCard>
  );
}
