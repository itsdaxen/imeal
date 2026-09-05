import { Skeleton } from "@heroui/react";

import { ContentCard } from "@/components/ui/content-card";
import { PageHeadingSkeleton } from "@/components/ui/page-skeleton";
import { PageShell } from "@/components/ui/page-shell";

export default function FriendsLoading() {
  return (
    <PageShell as="div">
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
    </PageShell>
  );
}
