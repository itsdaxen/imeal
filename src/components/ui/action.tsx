"use client";

import type { ComponentPropsWithoutRef } from "react";
import { useFormStatus } from "react-dom";

import { Button, buttonVariants, cn, Link } from "@heroui/react";

/**
 * The rank an action holds on its page.
 *
 * - `primary` — the one thing a view is for. At most one per page.
 * - `neutral` — a supporting action, weighted but not the point.
 * - `quiet` — navigation that happens to be an action.
 * - `danger` — an irreversible or destructive action. Soft rather than filled: it has
 *   to read as destructive without out-shouting the primary action beside it.
 *
 * Naming the rank puts it in the markup as `data-action-tier`, so "one primary per
 * page" is something `verify:routes` can check rather than something to remember.
 */
export type ActionTier = "primary" | "neutral" | "quiet" | "danger";

const tierVariant = {
  danger: "danger-soft",
  neutral: "tertiary",
  primary: "primary",
} as const;

type ActionLinkProps = Omit<
  ComponentPropsWithoutRef<typeof Link>,
  "className"
> & {
  className?: string;
  tier: ActionTier;
};

export function ActionLink({ className, tier, ...props }: ActionLinkProps) {
  return (
    <Link
      className={cn(
        tier === "quiet"
          ? "inline-flex min-h-11 items-center px-1"
          : buttonVariants({ variant: tierVariant[tier] }),
        tier === "quiet" ? undefined : "min-h-11",
        className,
      )}
      data-action-tier={tier}
      {...props}
    />
  );
}

type ActionButtonProps = Omit<
  ComponentPropsWithoutRef<typeof Button>,
  "variant"
> & {
  tier: Exclude<ActionTier, "quiet">;
};

export function ActionButton({
  className,
  isPending,
  tier,
  ...props
}: ActionButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      className={cn("min-h-11", className)}
      data-action-tier={tier}
      isPending={isPending || pending}
      variant={tierVariant[tier]}
      {...props}
    />
  );
}
