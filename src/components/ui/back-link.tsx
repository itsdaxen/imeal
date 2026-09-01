import type { ReactNode } from "react";

import { ArrowLeft } from "lucide-react";

import { ActionLink } from "./action";

/**
 * The way back up a level. `BackAction` walks browser history; this one names its
 * destination. Both use the same arrow, so the two never read as different things.
 */
export function BackLink({
  children,
  href,
}: {
  children: ReactNode;
  href: string;
}) {
  return (
    <ActionLink className="gap-1.5 self-start" href={href} tier="quiet">
      <ArrowLeft aria-hidden="true" className="size-4" />
      {children}
    </ActionLink>
  );
}
