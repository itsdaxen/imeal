import { Skeleton } from "@heroui/react";

import {
  CardSkeleton,
  PageHeadingSkeleton,
} from "@/components/ui/page-skeleton";

export default function CatalogLoading() {
  return (
    <div className="flex flex-col gap-8 pt-10 sm:pt-14">
      <PageHeadingSkeleton action={false} />
      <Skeleton className="h-11 w-full max-w-md" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <CardSkeleton key={index} media />
        ))}
      </div>
    </div>
  );
}
