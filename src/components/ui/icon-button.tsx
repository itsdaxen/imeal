"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { Button, Tooltip } from "@heroui/react";

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
export function IconButton({ children, label, ...props }: IconButtonProps) {
  return (
    <Tooltip closeDelay={0} delay={400}>
      <Button aria-label={label} isIconOnly {...props}>
        {children}
      </Button>
      <Tooltip.Content>{label}</Tooltip.Content>
    </Tooltip>
  );
}
