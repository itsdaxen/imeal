import type { ReactNode } from "react";
import { cn } from "@heroui/react";

/**
 * The grid a page of cards sits in.
 *
 * Four pages spelled out the same seven classes, which is four chances for one of them
 * to end up a column narrower than the rest. It is a list, so it stays a `<ul>`: screen
 * reader users are told how many recipes there are before reading them.
 */
export function CardGrid({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  /** Names the list when the heading above it is not adjacent. */
  label?: string;
}) {
  return (
    <ul
      aria-label={label}
      className={cn(
        "grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {children}
    </ul>
  );
}
