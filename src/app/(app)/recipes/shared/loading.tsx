import { Skeleton } from "@heroui/react";

import { ContentCard } from "@/components/ui/content-card";
import { PageHeadingSkeleton } from "@/components/ui/page-skeleton";
import { PageShell } from "@/components/ui/page-shell";

export default function SharedRecipesLoading() {
  return (
    <PageShell as="div">
      <PageHeadingSkeleton action={false} back />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <ContentCard
            className="h-full overflow-hidden"
            density="flush"
            key={index}
          >
            <Skeleton className="h-40 w-full rounded-none" />
            <div className="flex flex-col gap-3 px-5 pt-5">
              <div className="flex items-center gap-3">
                <Skeleton className="size-11 shrink-0 rounded-full" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="mt-auto flex items-center justify-between gap-2 px-5 pb-5">
              <Skeleton className="h-11 w-24" />
              <Skeleton className="h-11 w-44" />
            </div>
          </ContentCard>
        ))}
      </div>
    </PageShell>
  );
}
