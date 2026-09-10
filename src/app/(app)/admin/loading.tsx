import { Skeleton } from "@heroui/react";

import { ContentCard } from "@/components/ui/content-card";
import { PageHeadingSkeleton } from "@/components/ui/page-skeleton";
import { PageShell } from "@/components/ui/page-shell";

export default function AdminLoading() {
  return (
    <PageShell as="div" width="wide">
      <PageHeadingSkeleton action={false} />

      <ul className="flex list-none flex-col gap-6 p-0">
        <li>
          <ContentCard className="overflow-hidden" density="flush">
            <div className="grid md:grid-cols-[15rem_minmax(0,1fr)]">
              <Skeleton className="h-48 w-full md:h-full md:min-h-64" />

              <div className="flex min-w-0 flex-col gap-5 p-5 sm:p-7">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 shrink-0 rounded-full" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <Skeleton className="h-7 w-64 max-w-full" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-5 w-28" />

                <div className="grid gap-6 border-t border-border/70 pt-5 sm:grid-cols-2">
                  {[0, 1].map((section) => (
                    <div className="flex flex-col gap-2" key={section}>
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-3.5 w-full" />
                      <Skeleton className="h-3.5 w-4/5" />
                      <Skeleton className="h-3.5 w-3/5" />
                    </div>
                  ))}
                </div>
                <Skeleton className="h-16 w-full" />
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-4 border-t border-border/70 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-7">
              <Skeleton className="h-11 w-full sm:w-44" />
              <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-end">
                <div className="flex min-w-0 flex-col gap-2 sm:w-72">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-11 w-full" />
                </div>
                <Skeleton className="h-11 w-full sm:w-24" />
              </div>
            </div>
          </ContentCard>
        </li>
      </ul>
    </PageShell>
  );
}
