"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Button, Link } from "@heroui/react";

import {
  isCurrentSection,
  type AppHeaderNavigationItem,
} from "./header-navigation";
import { CountBadge } from "@/features/friends/components/friends-tabs";

type MobileNavigationProps = {
  items: ReadonlyArray<AppHeaderNavigationItem>;
};

export function MobileNavigation({ items }: MobileNavigationProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div className="lg:hidden">
      <Button
        aria-expanded={isOpen}
        aria-label="Open the main menu"
        className="size-11 rounded-full p-0"
        isIconOnly
        onPress={() => setIsOpen(true)}
        variant="ghost"
      >
        <Menu aria-hidden="true" className="size-5" />
      </Button>

      <button
        aria-hidden={!isOpen}
        aria-label="Close the main menu"
        className={`fixed inset-0 z-40 bg-foreground/25 backdrop-blur-xs transition-opacity duration-200 motion-reduce:transition-none ${
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsOpen(false)}
        tabIndex={isOpen ? 0 : -1}
        type="button"
      />

      <div
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col gap-4 border-r border-separator bg-surface px-3 py-4 transition-transform duration-200 will-change-transform motion-reduce:transition-none ${
          isOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <span className="font-brand text-2xl leading-normal">iMeal</span>
          <Button
            aria-label="Close the main menu"
            className="size-11 rounded-full p-0"
            isIconOnly
            onPress={() => setIsOpen(false)}
            variant="ghost"
          >
            <X aria-hidden="true" className="size-5" />
          </Button>
        </div>

        <nav aria-label="Main navigation">
          <ul className="flex list-none flex-col gap-1 p-0">
            {items.map((item) => {
              const isActive = isCurrentSection(pathname, item.href);

              return (
                <li key={item.href}>
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    className={`flex min-h-11 w-full items-center rounded-xl px-3 text-sm font-medium no-underline transition-colors motion-reduce:transition-none ${
                      isActive
                        ? "bg-foreground text-background"
                        : "text-muted hover:bg-default hover:text-foreground"
                    }`}
                    href={item.href}
                    onPress={() => setIsOpen(false)}
                  >
                    {item.label}
                    {item.badge ? <CountBadge count={item.badge} /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
