import type { ReactNode } from "react";

import { cva, type VariantProps } from "class-variance-authority";
import { cn, Typography } from "@heroui/react";

const formMessageVariants = cva("rounded-2xl px-4 py-3", {
  variants: {
    tone: {
      error: "bg-danger-soft text-danger-soft-foreground",
      notice: "bg-accent-soft text-foreground",
    },
  },
});

type FormMessageProps = VariantProps<typeof formMessageVariants> & {
  children: ReactNode;
  className?: string;
};

export function FormMessage({ children, className, tone }: FormMessageProps) {
  return (
    <Typography
      className={cn(formMessageVariants({ tone }), className)}
      role="alert"
      type="body-sm"
    >
      {children}
    </Typography>
  );
}
