import type { ReactNode } from "react";

import { cn } from "@heroui/react";

/**
 * The heading for a region of a page whose title is the h1.
 *
 * HeroUI's `Typography type="h2"` renders 30px against a 36px h1 — a 1.2× step, so a
 * section title reads as loud as the page title and nothing recedes. This sets the
 * level the ramp actually needs.
 */
export function SectionTitle({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <h2
      className={cn(
        "text-xl font-semibold text-foreground sm:text-2xl",
        className,
      )}
      id={id}
    >
      {children}
    </h2>
  );
}
