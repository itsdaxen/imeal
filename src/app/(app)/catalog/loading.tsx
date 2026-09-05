import { Skeleton } from "@heroui/react";

import {
  CardSkeleton,
  PageHeadingSkeleton,
} from "@/components/ui/page-skeleton";
import { PageShell } from "@/components/ui/page-shell";

export default function CatalogLoading() {
  return (
    <PageShell as="div">
      <PageHeadingSkeleton action={false} />
      <Skeleton className="h-11 w-full max-w-md" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <CardSkeleton key={index} media />
        ))}
      </div>
    </PageShell>
  );
}
