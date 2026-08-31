import { Skeleton } from "@heroui/react";

import { ContentCard } from "@/components/ui/content-card";

export default function RecipeDetailLoading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 pt-10 sm:pt-14">
      <ContentCard
        appearance="media"
        className="grid md:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]"
        density="flush"
      >
        <Skeleton className="min-h-64 rounded-none md:min-h-[30rem]" />
        <div className="flex flex-col justify-center gap-5 p-6 sm:p-8 lg:p-10">
          <Skeleton className="h-6 w-40 rounded-full" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-44" />
          <div className="flex gap-3">
            <Skeleton className="h-11 w-40 rounded-full" />
            <Skeleton className="h-11 w-28 rounded-full" />
          </div>
        </div>
      </ContentCard>

      <div className="grid gap-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-12">
        <ContentCard density="spacious">
          <Skeleton className="h-7 w-36" />
          {[0, 1, 2, 3].map((index) => (
            <Skeleton className="h-4 w-full" key={index} />
          ))}
        </ContentCard>
        <div className="flex flex-col gap-4 p-1 sm:p-2">
          <Skeleton className="h-7 w-24" />
          {[0, 1, 2, 3].map((index) => (
            <Skeleton className="h-4 w-full" key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
