import { Skeleton } from "@heroui/react";

import { ContentCard } from "@/components/ui/content-card";
import { FieldSkeleton } from "@/components/ui/page-skeleton";

export default function ProfileLoading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 pt-10 sm:pt-14">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <ContentCard className="gap-5" density="spacious">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="size-28 rounded-full" />
        <FieldSkeleton />
      </ContentCard>

      <ContentCard className="gap-5" density="spacious">
        <Skeleton className="h-7 w-48" />
        <div className="grid items-start gap-5 sm:grid-cols-[12rem_1fr]">
          <FieldSkeleton />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton className="h-11 w-full rounded-xl" key={index} />
            ))}
          </div>
        </div>
      </ContentCard>

      <ContentCard className="gap-5" density="spacious">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </ContentCard>
    </div>
  );
}
