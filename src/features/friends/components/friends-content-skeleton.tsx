import { Skeleton } from "@heroui/react";

import { ContentCard } from "@/components/ui/content-card";

export function FriendsContentSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <ContentCard>
        <Skeleton className="h-6 w-52" />
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-56 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-11 w-full" />
          </div>
          <Skeleton className="h-11 w-24" />
        </div>
      </ContentCard>

      <ContentCard>
        <Skeleton className="h-6 w-32" />
        <div className="flex min-h-16 items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3.5 w-52 max-w-full" />
          </div>
          <Skeleton className="h-9 w-20 shrink-0" />
        </div>
      </ContentCard>
    </div>
  );
}
