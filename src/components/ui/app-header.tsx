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
        // Three columns rather than justify-between: the brand is wider than the
        // avatar, so a flex row leaves the nav visibly closer to one side at every
        // width. Equal 1fr flanks centre it against the bar, not against its siblings.
        "grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 py-2 transition-[border-radius,background-color,box-shadow,padding,border-color] duration-200 ease-out motion-reduce:transition-none sm:px-5 sm:py-3",
        // Stuck, the bar around it carries the edge, so the card drops its own.
        "group-data-[stuck=true]:rounded-none group-data-[stuck=true]:bg-transparent group-data-[stuck=true]:py-1 group-data-[stuck=true]:shadow-none sm:group-data-[stuck=true]:py-1.5",
      )}
      role="banner"
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <MobileNavigation items={navigationItems} />

        <Link
          aria-label="iMeal home"
          className="flex min-h-11 items-center gap-2.5 px-1 text-foreground no-underline"
          href={homeHref}
        >
          <span className="font-brand text-2xl leading-normal">iMeal</span>
        </Link>
      </div>

      <HeaderNavigation items={navigationItems} label={navigationLabel} />

      <div className="flex items-center justify-self-end">{actions}</div>
    </Surface>
  );
}
