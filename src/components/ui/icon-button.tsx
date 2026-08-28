"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { Button, cn, Tooltip } from "@heroui/react";

type IconButtonProps = Omit<
  ComponentPropsWithoutRef<typeof Button>,
  "children" | "isIconOnly"
> & {
  children: ReactNode;
  /** Names the button for a screen reader and labels its tooltip. */
  label: string;
};

/**
 * An icon on its own says nothing until you hover it, so the label that a screen
 * reader gets is the same one everyone else can see.
 */
export function IconButton({
  children,
  className,
  label,
  ...props
}: IconButtonProps) {
  return (
    <Tooltip closeDelay={0} delay={400}>
      <Button
        aria-label={label}
        className={cn("min-h-11 min-w-11", className)}
        isIconOnly
        {...props}
      >
        {children}
      </Button>
      <Tooltip.Content>{label}</Tooltip.Content>
    </Tooltip>
  );
}
