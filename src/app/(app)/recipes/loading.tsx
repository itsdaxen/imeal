import {
  PageHeadingSkeleton,
  RecipeGridSkeleton,
  SearchFiltersSkeleton,
} from "@/components/ui/page-skeleton";
import { PageShell } from "@/components/ui/page-shell";

export default function RecipesLoading() {
  return (
    <PageShell as="div">
      <PageHeadingSkeleton actionCount={2} description={false} />
      <SearchFiltersSkeleton />
      <RecipeGridSkeleton />
    </PageShell>
  );
}
