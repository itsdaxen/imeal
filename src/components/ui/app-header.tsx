import type { ReactNode } from "react";
import { cn, Link, Surface } from "@heroui/react";

import { panelVariants } from "./content-card";
import {
  HeaderNavigation,
  type AppHeaderNavigationItem,
} from "./header-navigation";
import { MobileNavigation } from "./mobile-navigation";

export type { AppHeaderNavigationItem };

type AppHeaderProps = {
  actions?: ReactNode;
  homeHref: string;
  navigationItems: ReadonlyArray<AppHeaderNavigationItem>;
  navigationLabel: string;
};

export function AppHeader({
  actions,
  homeHref,
  navigationItems,
  navigationLabel,
}: AppHeaderProps) {
  return (
    <Surface
      className={cn(
        panelVariants({ density: "flush" }),
        // A Surface, not a Card, so the radius and shadow that Card supplies are set here.
        "rounded-3xl shadow-surface",
        "flex items-center justify-between gap-3 px-3 py-2 transition-[border-radius,background-color,box-shadow,padding,border-color] duration-200 ease-out motion-reduce:transition-none sm:px-5 sm:py-3",
        // Stuck, the bar around it carries the edge, so the card drops its own.
        "group-data-[stuck=true]:rounded-none group-data-[stuck=true]:bg-transparent group-data-[stuck=true]:py-1 group-data-[stuck=true]:shadow-none sm:group-data-[stuck=true]:py-1.5",
      )}
      role="banner"
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <MobileNavigation items={navigationItems} />

        <Link
          aria-label="iMeal home"
          className="flex items-center gap-2.5 text-foreground no-underline"
          href={homeHref}
        >
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-full bg-accent text-sm font-bold text-accent-foreground shadow-sm"
          >
            i
          </span>
          <span className="truncate text-lg font-semibold tracking-tight">
            iMeal
          </span>
        </Link>
      </div>

      <HeaderNavigation items={navigationItems} label={navigationLabel} />

      {actions}
    </Surface>
  );
}
