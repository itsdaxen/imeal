import { Skeleton } from "@heroui/react";

export default function RecipesLoading() {
  return (
    <div className="flex flex-col gap-8 pt-10 sm:pt-14">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-12 w-full" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <Skeleton className="h-32 w-full" key={index} />
        ))}
      </div>
    </div>
  );
}
