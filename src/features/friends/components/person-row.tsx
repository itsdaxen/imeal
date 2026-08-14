import type { ReactNode } from "react";

export function PersonRow({
  actions,
  name,
}: {
  actions: ReactNode;
  name: string;
}) {
  return (
    <li className="flex items-center justify-between gap-4 border-b border-border/60 py-3">
      <span className="font-medium">{name}</span>
      <div className="flex items-center gap-2">{actions}</div>
    </li>
  );
}
