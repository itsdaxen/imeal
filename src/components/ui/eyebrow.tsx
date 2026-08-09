import type { ReactNode } from "react";

import { cva, type VariantProps } from "class-variance-authority";
import { cn, Typography } from "@heroui/react";

// The component carries the case and the tracking, so call sites pass ordinary words.
const eyebrowVariants = cva("tracking-widest uppercase", {
  variants: {
    tone: {
      info: "text-identity-strong",
      media: "text-media-eyebrow",
      surface: "text-muted",
    },
  },
  defaultVariants: {
    tone: "surface",
  },
});

type EyebrowProps = VariantProps<typeof eyebrowVariants> & {
  children: ReactNode;
  className?: string;
};

export function Eyebrow({ children, className, tone }: EyebrowProps) {
  return (
    <Typography
      className={cn(eyebrowVariants({ tone }), className)}
      type="body-xs"
      weight="semibold"
    >
      {children}
    </Typography>
  );
}
