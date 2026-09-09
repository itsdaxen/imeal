"use client";

import type { MouseEvent } from "react";
import { useOptimistic, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

/** The browser's own jobs — a new tab, a new window, a download — are left alone. */
function isPlainClick(event: MouseEvent) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

/**
 * A route change you can see starting.
 *
 * `router.push` inside a transition is what makes `isPending` true for the length of
 * the navigation; without it the press does nothing visible until the new page is
 * ready, which on a slow connection is indistinguishable from a missed click.
 */
export function useRouteChange() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function go(href: string) {
    return (event: MouseEvent) => {
      if (!isPlainClick(event)) {
        return;
      }

      event.preventDefault();
      startTransition(() => router.push(href));
    };
  }

  return { go, isPending };
}

/**
 * Tabs that answer the moment you press them.
 *
 * A tab is a control, and a control that waits for a server before acknowledging you
 * reads as one that missed the click. The selection moves at once and the panel below
 * says it is busy, rather than the whole strip sitting still until the data lands.
 *
 * Links stay links: the press is only intercepted for an ordinary left click, so
 * middle-click and cmd-click still open a tab the way they do anywhere else.
 */
export function useRouteTabs(
  tabs: ReadonlyArray<{ href: string; id: string }>,
  /**
   * Which tab the server rendered. Pass it where tabs differ by query string rather
   * than by path, which a pathname cannot tell apart.
   */
  openId?: string,
) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const current =
    openId ??
    tabs.find((tab) => pathname === tab.href)?.id ??
    tabs.find((tab) => pathname.startsWith(`${tab.href}/`))?.id ??
    tabs[0]?.id;

  // Resets to `current` when the navigation settles, so a failed one cannot leave the
  // strip pointing at a page you are not on.
  const [selected, select] = useOptimistic(current, (_, id: string) => id);

  function open(tab: { href: string; id: string }) {
    return (event: MouseEvent) => {
      if (!isPlainClick(event)) {
        return;
      }

      event.preventDefault();
      startTransition(() => {
        select(tab.id);
        router.push(tab.href);
      });
    };
  }

  return { isPending, open, selected };
}
