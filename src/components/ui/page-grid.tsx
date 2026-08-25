import type { ReactNode } from "react";

import { cn } from "@heroui/react";

/**
 * One twelve-column grid, and one split within it. Every row shares the same column
 * edges, which is the whole reason the page reads as a grid rather than as cards that
 * happen to sit near each other.
 */
export function PageGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-12 gap-4 sm:gap-5", className)}>
      {children}
    </div>
  );
}

export const span = {
  /** The full width of the page. */
  full: "col-span-12",
  /** The wide half of the split. */
  wide: "col-span-12 lg:col-span-8",
  /** The narrow half, whose edges the third-width cards below also use. */
  narrow: "col-span-12 lg:col-span-4",
  /** A third, aligning to the split's edges on large screens. */
  third: "col-span-12 sm:col-span-6 lg:col-span-4",
} as const;
