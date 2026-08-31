import { Skeleton } from "@heroui/react";

import { ContentCard } from "@/components/ui/content-card";
import {
  FieldSkeleton,
  PageHeadingSkeleton,
} from "@/components/ui/page-skeleton";

/** Matches the authoring layout, which edit and create both render. */
export function RecipeFormSkeleton() {
  return (
    <div className="flex w-full flex-col gap-8 pt-10 sm:pt-14">
      <PageHeadingSkeleton />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <ContentCard className="gap-5" density="spacious">
            <Skeleton className="h-7 w-40" />
            <FieldSkeleton />
            <FieldSkeleton rows={7} />
          </ContentCard>
          <ContentCard className="gap-5" density="spacious">
            <Skeleton className="h-7 w-28" />
            <FieldSkeleton rows={9} />
            <FieldSkeleton rows={3} />
          </ContentCard>
        </div>

        <ContentCard className="gap-5" density="spacious">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="aspect-4/3 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            <FieldSkeleton />
            <FieldSkeleton />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton className="h-11 w-full rounded-xl" key={index} />
            ))}
          </div>
          <Skeleton className="h-11 w-full rounded-full" />
        </ContentCard>
      </div>
    </div>
  );
}
