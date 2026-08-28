import type { ReactNode } from "react";

import { Typography } from "@heroui/react";

import { PersonAvatar } from "@/components/ui/person-avatar";

export function PersonRow({
  actions,
  context,
  name,
}: {
  actions: ReactNode;
  context?: string;
  name: string;
}) {
  return (
    <li className="flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-separator py-2 last:border-b-0">
      <span className="flex min-w-44 flex-1 items-center gap-3">
        <PersonAvatar name={name} />
        <span className="min-w-0">
          <span className="block truncate font-medium">{name}</span>
          {context ? (
            <Typography color="muted" type="body-xs">
              {context}
            </Typography>
          ) : null}
        </span>
      </span>
      <div className="flex items-center gap-2">{actions}</div>
    </li>
  );
}
