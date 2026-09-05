import {
  CardSkeleton,
  PageHeadingSkeleton,
} from "@/components/ui/page-skeleton";
import { PageShell } from "@/components/ui/page-shell";

export default function SharedRecipesLoading() {
  return (
    <PageShell as="div">
      <PageHeadingSkeleton />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <CardSkeleton key={index} lines={3} media />
        ))}
      </div>
    </PageShell>
  );
}
