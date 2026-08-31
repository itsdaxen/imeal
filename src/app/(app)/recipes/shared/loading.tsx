import {
  CardSkeleton,
  PageHeadingSkeleton,
} from "@/components/ui/page-skeleton";

export default function SharedRecipesLoading() {
  return (
    <div className="flex flex-col gap-8 pt-10 sm:pt-14">
      <PageHeadingSkeleton />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <CardSkeleton key={index} lines={3} media />
        ))}
      </div>
    </div>
  );
}
