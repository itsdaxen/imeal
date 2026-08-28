// Card.Title is a client component, and the level switch hands it a render
// function, which a server component cannot serialise across the boundary.
"use client";

import type { ReactNode } from "react";

import { Card, cn } from "@heroui/react";

/**
 * The title of a panel on a page whose heading is the h1. Card.Title renders an h3,
 * which keeps the outline honest as long as the region carries its own h2 — pass
 * `level={2}` where the panel is itself the section, as it is on a form.
 */
export function PanelTitle({
  children,
  className,
  id,
  level = 3,
}: {
  children: ReactNode;
  className?: string;
  /** For a region that names itself with aria-labelledby. */
  id?: string;
  level?: 2 | 3;
}) {
  return (
    <Card.Title
      className={cn("text-xl font-semibold sm:text-2xl", className)}
      id={id}
      render={(props) =>
        level === 2 ? (
          <h2 {...props}>{children}</h2>
        ) : (
          <h3 {...props}>{children}</h3>
        )
      }
    />
  );
}
