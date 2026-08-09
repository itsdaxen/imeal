import type { VariantProps } from "class-variance-authority";
import type { CardRootProps } from "@heroui/react";
import type { ComponentPropsWithoutRef } from "react";

import { cva } from "class-variance-authority";
import { Card, cn } from "@heroui/react";

/**
 * Only what HeroUI's Card does not already give us. It supplies the radius, the
 * surface shadow, `p-4`, and the column layout; adding those again here is how the
 * two drift apart.
 */
export const panelVariants = cva("", {
  variants: {
    appearance: {
      media: "overflow-hidden",
      // No border: HeroUI's card is defined by its shadow, and a hairline on top of
      // that reads as a harder, cheaper edge.
      surface: "",
    },
    density: {
      compact: "",
      comfortable: "p-6",
      flush: "p-0",
      spacious: "gap-5 p-5 md:p-7",
    },
  },
  defaultVariants: {
    appearance: "surface",
    density: "comfortable",
  },
});

type ContentCardProps = CardRootProps &
  Omit<ComponentPropsWithoutRef<"div">, keyof CardRootProps> &
  VariantProps<typeof panelVariants>;

export function ContentCard({
  appearance,
  className,
  density,
  ...props
}: ContentCardProps) {
  return (
    <Card
      className={cn(panelVariants({ appearance, density }), className)}
      {...props}
    />
  );
}
