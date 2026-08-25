"use client";

import type { ReactNode } from "react";

import { useEffect, useRef, useState } from "react";
import { cn } from "@heroui/react";

/**
 * At rest the header is a card inside the page. Once it sticks it spans the window,
 * because a floating card pinned to the top edge reads as something that failed to
 * scroll away. A sentinel above it decides which of the two it is, rather than a
 * scroll listener firing on every frame.
 */
export function StickyHeader({ children }: { children: ReactNode }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    const node = sentinel.current;

    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) =>
      setIsStuck(!entry.isIntersecting),
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div aria-hidden="true" className="h-px" ref={sentinel} />

      <div
        className={cn(
          "group sticky top-0 z-40 transition-[background-color,border-color] duration-200 ease-out motion-reduce:transition-none",
          isStuck && "border-b border-border/80 bg-surface/85 backdrop-blur-md",
        )}
        data-stuck={isStuck ? "true" : undefined}
      >
        <div
          className={cn(
            "mx-auto w-full max-w-7xl px-4 transition-[padding] duration-200 ease-out motion-reduce:transition-none sm:px-6 lg:px-8",
            isStuck ? "py-0" : "pt-4 sm:pt-6 lg:pt-8",
          )}
        >
          {children}
        </div>
      </div>
    </>
  );
}
