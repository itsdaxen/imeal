"use client";

import type { ReactNode } from "react";
import NextLink from "next/link";

import { PendingPanel } from "@/components/ui/pending-panel";
import { useRouteChange } from "@/lib/use-route-tabs";

/**
 * The week you are looking at, and the controls that change it.
 *
 * The grid is a child rather than a sibling because these links are what know a new
 * week is on its way: the one you are leaving stays put and says it is busy, instead
 * of the page sitting unchanged until the next week arrives.
 */
export function WeekSwitcher({
  children,
  nextHref,
  previousHref,
}: {
  children: ReactNode;
  nextHref: string;
  previousHref: string;
}) {
  const { go, isPending } = useRouteChange();
  const links = [
    { href: previousHref, label: "Previous" },
    { href: "/planner", label: "This week" },
    { href: nextHref, label: "Next" },
  ];

  return (
    <>
      <PendingPanel isPending={isPending}>{children}</PendingPanel>

      <nav
        aria-label="Change week"
        className="flex items-center justify-center gap-6"
      >
        {links.map((link) => (
          <NextLink
            className="link inline-flex min-h-11 items-center"
            href={link.href}
            key={link.label}
            onClick={go(link.href)}
          >
            {link.label}
          </NextLink>
        ))}
      </nav>
    </>
  );
}
