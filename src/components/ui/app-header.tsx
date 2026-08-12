import type { ReactNode } from "react";
import { cva } from "class-variance-authority";
import { cn, Link, Surface } from "@heroui/react";

import { panelVariants } from "./content-card";

const navigationLinkVariants = cva("rounded-full no-underline", {
  variants: {
    state: {
      active: "bg-default text-foreground",
      idle: "text-muted",
    },
    viewport: {
      desktop: "px-4 py-2",
      mobile: "block px-2 py-2",
    },
  },
  compoundVariants: [
    {
      className: "font-medium",
      state: "active",
      viewport: "desktop",
    },
    {
      className:
        "transition-colors hover:bg-default hover:text-foreground motion-reduce:transition-none",
      state: "idle",
      viewport: "desktop",
    },
  ],
});

const navigationVariants = cva("", {
  variants: {
    viewport: {
      desktop: "hidden md:block",
      mobile: "w-full border-t border-separator pt-2 md:hidden",
    },
  },
});

const navigationListVariants = cva("flex items-center gap-1", {
  variants: {
    viewport: {
      desktop: "text-sm",
      mobile: "text-center text-xs font-medium",
    },
  },
});

export type AppHeaderNavigationItem = {
  href: string;
  label: string;
  mobileLabel?: string;
};

type AppHeaderProps = {
  actions?: ReactNode;
  activeHref: string;
  homeHref: string;
  navigationItems: ReadonlyArray<AppHeaderNavigationItem>;
  navigationLabel: string;
  user: {
    displayName: string;
    initials: string;
  };
};

function BrandMark() {
  return (
    <span
      aria-hidden="true"
      className="grid size-9 place-items-center rounded-full bg-accent text-sm font-bold text-accent-foreground shadow-sm"
    >
      i
    </span>
  );
}

function HeaderNavigation({
  activeHref,
  items,
  label,
  viewport,
}: {
  activeHref: string;
  items: ReadonlyArray<AppHeaderNavigationItem>;
  label: string;
  viewport: "desktop" | "mobile";
}) {
  return (
    <nav aria-label={label} className={navigationVariants({ viewport })}>
      <ul className={navigationListVariants({ viewport })}>
        {items.map((item) => {
          const isActive = item.href === activeHref;

          return (
            <li
              className={viewport === "mobile" ? "min-w-0 flex-1" : undefined}
              key={item.href}
            >
              <Link
                aria-current={isActive ? "page" : undefined}
                className={navigationLinkVariants({
                  state: isActive ? "active" : "idle",
                  viewport,
                })}
                href={item.href}
              >
                {viewport === "mobile"
                  ? (item.mobileLabel ?? item.label)
                  : item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppHeader({
  actions,
  activeHref,
  homeHref,
  navigationItems,
  navigationLabel,
  user,
}: AppHeaderProps) {
  return (
    <Surface
      className={cn(
        panelVariants({ density: "flush" }),
        "flex flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-5",
      )}
      role="banner"
    >
      <Link
        aria-label="iMeal home"
        className="flex items-center gap-2.5 text-foreground no-underline"
        href={homeHref}
      >
        <BrandMark />
        <span className="text-lg font-semibold tracking-tight">iMeal</span>
      </Link>

      <HeaderNavigation
        activeHref={activeHref}
        items={navigationItems}
        label={navigationLabel}
        viewport="desktop"
      />

      <div className="flex items-center gap-3">
        <span
          aria-label={`Signed in as ${user.displayName}`}
          className="grid size-9 place-items-center rounded-full bg-foreground text-xs font-semibold text-background"
          role="img"
        >
          {user.initials}
        </span>
        {actions}
      </div>

      <HeaderNavigation
        activeHref={activeHref}
        items={navigationItems}
        label={`Mobile ${navigationLabel.toLowerCase()}`}
        viewport="mobile"
      />
    </Surface>
  );
}
