import type { VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";

import { cva } from "class-variance-authority";
import { cn } from "@heroui/react";

const iconBadgeVariants = cva(
  "grid size-11 shrink-0 place-items-center rounded-full",
  {
    variants: {
      tone: {
        accent: "bg-accent-soft text-accent-soft-foreground",
        neutral: "bg-default text-foreground",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

type IconBadgeProps = ComponentPropsWithoutRef<"span"> &
  VariantProps<typeof iconBadgeVariants>;

export function IconBadge({ className, tone, ...props }: IconBadgeProps) {
  return (
    <span className={cn(iconBadgeVariants({ tone }), className)} {...props} />
  );
}
