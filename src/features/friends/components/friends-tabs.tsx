"use client";

import type { ReactNode } from "react";
import NextLink from "next/link";
import { Badge, cn } from "@heroui/react";

import { PendingPanel } from "@/components/ui/pending-panel";
import { useRouteTabs } from "@/lib/use-route-tabs";

/**
 * Friends and invitations are two routes shown as one strip.
 *
 * They used to share a page, where accepting or sending a request added a panel and
 * resized the two beside it — the page rearranged itself around you as you acted. Two
 * routes cannot do that to each other, and the count sits where you would look for it
 * rather than appearing as a new heading.
 */
const TABS = [
  { href: "/friends", id: "friends", label: "Friends" },
  { href: "/friends/invites", id: "invites", label: "Invitations" },
] as const;

export function FriendsTabs({
  children,
  waiting,
}: {
  children: ReactNode;
  waiting: number;
}) {
  const { isPending, open, selected } = useRouteTabs(TABS);

  return (
    <>
      <nav aria-label="Friends sections">
        <ul className="flex list-none items-center gap-1 p-0">
          {TABS.map((tab) => {
            const isOpen = tab.id === selected;

            return (
              <li key={tab.id}>
                <NextLink
                  aria-current={isOpen ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-2 rounded-3xl px-4 text-sm no-underline transition-colors",
                    isOpen
                      ? "bg-accent-soft font-medium text-accent"
                      : "text-muted hover:bg-default hover:text-foreground",
                  )}
                  href={tab.href}
                  onClick={open(tab)}
                >
                  {tab.label}
                  {tab.id === "invites" && waiting > 0 ? (
                    <CountBadge count={waiting} />
                  ) : null}
                </NextLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <PendingPanel isPending={isPending}>{children}</PendingPanel>
    </>
  );
}

/**
 * The number of people waiting on you.
 *
 * HeroUI's Badge, so the colour and size come from the same place as everything else.
 * It is built to hang off the corner of an avatar or an icon, which is why it carries
 * `position: absolute` by default; `data-inline` in globals.css puts it back in the
 * line, beside a word instead of on top of one.
 *
 * Announced as words because "Friends 2" read aloud is a riddle; the digit is for the
 * eye only.
 */
export function CountBadge({ count }: { count: number }) {
  return (
    <>
      <Badge
        aria-hidden="true"
        color="danger"
        data-inline=""
        size="sm"
        variant="primary"
      >
        {count > 9 ? "9+" : count}
      </Badge>
      <span className="sr-only">
        {count === 1 ? "1 waiting on you" : `${count} waiting on you`}
      </span>
    </>
  );
}
