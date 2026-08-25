import type { ComponentPropsWithoutRef } from "react";

import { Button, buttonVariants, cn, Link } from "@heroui/react";

/**
 * The rank an action holds on its page.
 *
 * - `primary` — the one thing a view is for. At most one per page.
 * - `neutral` — a supporting action, weighted but not the point.
 * - `quiet` — navigation that happens to be an action.
 *
 * Naming the rank puts it in the markup as `data-action-tier`, so "one primary per
 * page" is something `verify:routes` can check rather than something to remember.
 */
export type ActionTier = "primary" | "neutral" | "quiet";

const tierVariant = {
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
          ? undefined
          : buttonVariants({ variant: tierVariant[tier] }),
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

export function ActionButton({ tier, ...props }: ActionButtonProps) {
  return (
    <Button data-action-tier={tier} variant={tierVariant[tier]} {...props} />
  );
}
