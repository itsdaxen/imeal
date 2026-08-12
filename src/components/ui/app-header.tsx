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
        "flex items-center justify-between gap-3 px-3 py-2 sm:px-5 sm:py-3",
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
          <BrandMark />
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
