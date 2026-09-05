import type { ReactNode } from "react";
import { cn } from "@heroui/react";

const widths = {
  full: "",
  narrow: "mx-auto w-full max-w-3xl",
  wide: "mx-auto w-full max-w-5xl",
} as const;

const gaps = {
  compact: "gap-4",
  snug: "gap-6",
  normal: "gap-8",
  loose: "gap-10",
} as const;

/**
 * The frame every signed-in page sits in.
 *
 * Thirteen different class strings were spelling out the same idea, which is why the
 * gap between a page's heading and its content was never quite the same twice. Naming
 * the two things that legitimately vary — how wide the column is and how far apart its
 * sections sit — makes the remaining differences deliberate and visible in the markup.
 *
 * `as="div"` exists for `loading.tsx`: a skeleton has to occupy the same frame as the
 * page it stands in for, or the content jumps the moment it arrives, and only one
 * `<main>` may exist at a time.
 */
export function PageShell({
  as: Element = "main",
  children,
  className,
  gap = "normal",
  width = "full",
}: {
  as?: "div" | "main";
  children: ReactNode;
  className?: string;
  gap?: keyof typeof gaps;
  width?: keyof typeof widths;
}) {
  return (
    <Element
      className={cn(
        "flex flex-col pt-10 sm:pt-14",
        gaps[gap],
        widths[width],
        className,
      )}
    >
      {children}
    </Element>
  );
}
