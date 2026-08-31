import { Skeleton } from "@heroui/react";

import { ContentCard } from "@/components/ui/content-card";
import { PageHeadingSkeleton } from "@/components/ui/page-skeleton";

export default function FriendsLoading() {
  return (
    <div className="flex flex-col gap-8 pt-10 sm:pt-14">
      <PageHeadingSkeleton action={false} />
      <ContentCard className="gap-5" density="spacious">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-11 w-full max-w-md" />
      </ContentCard>
      <ContentCard className="gap-5" density="spacious">
        <Skeleton className="h-7 w-32" />
        {[0, 1, 2].map((index) => (
          <div className="flex items-center gap-3" key={index}>
            <Skeleton className="size-11 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </ContentCard>
    </div>
  );
}
