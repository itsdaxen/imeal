import { Skeleton } from "@heroui/react";

import { ContentCard } from "@/components/ui/content-card";
import {
  FieldSkeleton,
  PageHeadingSkeleton,
} from "@/components/ui/page-skeleton";

export default function ImportRecipeLoading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 pt-10 sm:pt-14">
      <PageHeadingSkeleton />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <ContentCard className="gap-5" density="spacious">
          <Skeleton className="h-7 w-52" />
          <FieldSkeleton rows={15} />
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-11 w-36 rounded-full" />
          </div>
        </ContentCard>

        <ContentCard className="gap-5" density="spacious">
          <Skeleton className="h-7 w-44" />
          {[0, 1, 2].map((index) => (
            <div className="flex items-start gap-3" key={index}>
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3.5 w-full" />
              </div>
            </div>
          ))}
        </ContentCard>
      </div>
    </div>
  );
}
