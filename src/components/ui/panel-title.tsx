import type { ReactNode } from "react";

import { Card, cn } from "@heroui/react";

/**
 * The title of a panel on a page whose heading is the h1. Card.Title renders an h3,
 * which keeps the outline honest as long as the region carries its own h2.
 */
export function PanelTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card.Title className={cn("text-xl font-semibold sm:text-2xl", className)}>
      {children}
    </Card.Title>
  );
}
