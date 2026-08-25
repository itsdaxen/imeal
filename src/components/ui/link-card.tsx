import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn, Link } from "@heroui/react";

import { ContentCard } from "./content-card";

/**
 * A card whose whole surface opens one thing.
 *
 * The pattern needs three things to agree — the card is the positioning context, the
 * anchor is taken out of it, and the anchor's ::after covers the card — so they live
 * here together rather than as three class strings a caller has to remember.
 */
export function LinkCard({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<typeof ContentCard>) {
  return (
    <ContentCard
      className={cn("card-link group relative transition-shadow", className)}
      {...props}
    >
      {children}
    </ContentCard>
  );
}

/** The link the card stands for. Its text is the card's accessible name. */
function LinkCardTarget({
  children,
  className,
  href,
}: {
  children: ReactNode;
  className?: string;
  href: string;
}) {
  return (
    <Link
      className={cn(
        "static! text-foreground no-underline after:absolute after:inset-0 after:content-['']",
        className,
      )}
      href={href}
    >
      {children}
    </Link>
  );
}

LinkCard.Target = LinkCardTarget;
