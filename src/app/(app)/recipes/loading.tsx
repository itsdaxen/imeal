import { Skeleton } from "@heroui/react";
import { PageShell } from "@/components/ui/page-shell";

export default function RecipesLoading() {
  return (
    <PageShell as="div">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-12 w-full" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <Skeleton className="h-32 w-full" key={index} />
        ))}
      </div>
    </PageShell>
  );
}
