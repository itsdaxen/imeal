import { Skeleton } from "@heroui/react";

import { ContentCard } from "@/components/ui/content-card";
import {
  FieldSkeleton,
  PageHeadingSkeleton,
} from "@/components/ui/page-skeleton";
import { PageShell } from "@/components/ui/page-shell";

export default function ProfileLoading() {
  return (
    <PageShell as="div" width="narrow">
      <PageHeadingSkeleton action={false} description={false} />

      <div className="flex flex-col gap-6">
        <ContentCard className="gap-5" density="spacious">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="size-28 rounded-full" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-4 w-56 max-w-full" />
          <FieldSkeleton />
        </ContentCard>

        <ContentCard className="gap-5" density="spacious">
          <Skeleton className="h-7 w-48" />
          <div className="grid items-start gap-5 sm:grid-cols-[12rem_1fr]">
            <FieldSkeleton />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[0, 1, 2, 3].map((index) => (
                <Skeleton className="h-11 w-full" key={index} />
              ))}
            </div>
          </div>
          <Skeleton className="h-4 w-4/5" />
        </ContentCard>

        <ContentCard className="gap-5" density="spacious">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-11 w-full" />
        </ContentCard>

        <div className="flex items-center justify-between gap-4 p-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-11 w-28" />
        </div>
      </div>

      <ContentCard className="gap-0" density="flush">
        <div className="flex items-center justify-between gap-4 p-5 md:p-7">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <Skeleton className="size-5 shrink-0" />
        </div>
      </ContentCard>
    </PageShell>
  );
}
