import { Skeleton } from "@heroui/react";

import { ContentCard } from "@/components/ui/content-card";
import { FieldSkeleton } from "@/components/ui/page-skeleton";

export default function OnboardingLoading() {
  return (
    <ContentCard
      className="mx-auto min-h-[calc(100svh-2.5rem)] w-full max-w-5xl gap-0 sm:min-h-[calc(100svh-4rem)]"
      density="flush"
    >
      <header className="flex items-center justify-between p-6 sm:p-8">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-2 w-28" />
        <Skeleton className="h-4 w-10" />
      </header>
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-4 px-6 py-10 sm:px-10">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-5 w-full max-w-xl" />
        <div className="mt-4 max-w-xl">
          <FieldSkeleton />
        </div>
      </div>
      <footer className="flex justify-between border-t border-separator p-6 sm:p-8">
        <Skeleton className="h-11 w-24" />
        <Skeleton className="h-11 w-28" />
      </footer>
    </ContentCard>
  );
}
