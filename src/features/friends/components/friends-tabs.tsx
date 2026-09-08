"use client";

import { usePathname } from "next/navigation";
import { Badge, cn, Link } from "@heroui/react";

/**
 * Friends and invitations are two routes shown as one strip.
 *
 * They used to share a page, where accepting or sending a request added a panel and
 * resized the two beside it — the page rearranged itself around you as you acted. Two
 * routes cannot do that to each other, and the count sits where you would look for it
 * rather than appearing as a new heading.
 */
export function FriendsTabs({ waiting }: { waiting: number }) {
  // Read here rather than passed in: the layout that renders this is not re-rendered
  // when you move between its children, so a value resolved on the server would still
  // name the tab you came from.
  const pathname = usePathname();
  const tabs = [
    { href: "/friends", id: "friends" as const, label: "Friends" },
    { href: "/friends/invites", id: "invites" as const, label: "Invitations" },
  ];

  return (
    <nav aria-label="Friends sections">
      <ul className="flex list-none items-center gap-1 p-0">
        {tabs.map((tab) => {
          const isOpen =
            tab.href === "/friends"
              ? pathname === "/friends"
              : pathname.startsWith(tab.href);

          return (
            <li key={tab.id}>
              <Link
                aria-current={isOpen ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-3xl px-4 text-sm no-underline transition-colors",
                  isOpen
                    ? "bg-accent-soft font-medium text-accent"
                    : "text-muted hover:bg-default hover:text-foreground",
                )}
                href={tab.href}
              >
                {tab.label}
                {tab.id === "invites" && waiting > 0 ? (
                  <CountBadge count={waiting} />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
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
