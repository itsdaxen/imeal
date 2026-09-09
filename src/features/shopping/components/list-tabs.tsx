"use client";

import type { ReactNode } from "react";
import NextLink from "next/link";

import { PendingPanel } from "@/components/ui/pending-panel";
import { useRouteTabs } from "@/lib/use-route-tabs";

import { NewListButton } from "./new-list-button";

export type ListTab = { id: string; isOwn: boolean; name: string };

/**
 * The list tabs, and the list they sit on top of.
 *
 * The panel is a child rather than a sibling because the tab strip is what knows the
 * switch is in flight: pressing a tab moves the selection at once and the list below
 * says it is fetching, instead of nothing happening until the new list arrives.
 */
export function ListTabs({
  children,
  lists,
  openListId,
  weekStart,
}: {
  children: ReactNode;
  lists: ListTab[];
  openListId: string | null;
  weekStart: string;
}) {
  const tabs = lists.map((entry) => ({
    href: `/shopping?week=${weekStart}&list=${entry.id}`,
    id: entry.id,
  }));
  const { isPending, open, selected } = useRouteTabs(
    tabs,
    openListId ?? undefined,
  );

  return (
    <>
      <nav
        aria-label="Shopping lists"
        className="flex min-w-0 shrink-0 [scrollbar-width:none] items-center gap-1 overflow-x-auto border-b border-separator bg-default px-3 py-2 [&::-webkit-scrollbar]:hidden"
      >
        {lists.map((entry, index) => {
          const isOpen = entry.id === selected;

          return (
            <NextLink
              aria-current={isOpen ? "page" : undefined}
              className={`grid min-h-10 shrink-0 place-items-center rounded-3xl px-4 text-sm no-underline transition-colors ${
                isOpen
                  ? "bg-accent-soft font-medium text-accent"
                  : "text-muted hover:bg-surface hover:text-foreground"
              }`}
              href={tabs[index].href}
              key={entry.id}
              onClick={open(tabs[index])}
            >
              {entry.name}
              {entry.isOwn ? "" : " · shared"}
            </NextLink>
          );
        })}

        <NewListButton className="ml-2 min-h-10" />
      </nav>

      <PendingPanel isPending={isPending}>{children}</PendingPanel>
    </>
  );
}
