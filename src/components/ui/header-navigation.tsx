"use client";

import { usePathname } from "next/navigation";
import { cva } from "class-variance-authority";
import { Link } from "@heroui/react";

const navigationLinkVariants = cva(
  "flex min-h-11 items-center rounded-full px-4 no-underline transition-[min-height] duration-200 ease-out group-data-[stuck=true]:min-h-9 motion-reduce:transition-none",
  {
    variants: {
      state: {
        // The one dark element on the page: it appears once, anchors the header, and
        // keeps the accent free for the primary action rather than marking position.
        active: "bg-foreground font-medium text-background",
        idle: "text-muted transition-colors hover:bg-default hover:text-foreground motion-reduce:transition-none",
      },
    },
  },
);

export type AppHeaderNavigationItem = {
  href: string;
  label: string;
};

// Only the root matches exactly; a section stays current while you are inside it,
// so /recipes/<id> still marks Recipes.
export function isCurrentSection(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

// A Client Component because layouts are not re-rendered when navigating between
// their children, so a pathname resolved on the server would go stale after the
// first client-side navigation.
export function HeaderNavigation({
  items,
  label,
}: {
  items: ReadonlyArray<AppHeaderNavigationItem>;
  label: string;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className="hidden lg:block">
      <ul className="flex list-none items-center gap-1 p-0 text-sm">
        {items.map((item) => {
          const isActive = isCurrentSection(pathname, item.href);

          return (
            <li key={item.href}>
              <Link
                aria-current={isActive ? "page" : undefined}
                className={navigationLinkVariants({
                  state: isActive ? "active" : "idle",
                })}
                href={item.href}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
