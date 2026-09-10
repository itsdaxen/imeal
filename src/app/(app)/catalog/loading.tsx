import {
  PageHeadingSkeleton,
  RecipeGridSkeleton,
  SearchFiltersSkeleton,
} from "@/components/ui/page-skeleton";
import { PageShell } from "@/components/ui/page-shell";

export default function CatalogLoading() {
  return (
    <PageShell as="div" gap="loose">
      <PageHeadingSkeleton action={false} />
      <SearchFiltersSkeleton />
      <RecipeGridSkeleton />
    </PageShell>
  );
}
