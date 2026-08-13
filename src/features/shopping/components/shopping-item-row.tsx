import { Button } from "@heroui/react";

import { removeItem, toggleItemChecked } from "../shopping.actions";
import type { ShoppingItem } from "../shopping.queries";

type ShoppingItemRowProps = {
  item: ShoppingItem;
  weekStart: string;
};

export function ShoppingItemRow({ item, weekStart }: ShoppingItemRowProps) {
  return (
    <li className="flex items-center justify-between gap-2 border-b border-border/60">
      <form action={toggleItemChecked} className="min-w-0 flex-1">
        <input name="itemId" type="hidden" value={item.id} />
        <input name="weekStart" type="hidden" value={weekStart} />

        {/* The whole row is the target, so an item can be ticked off one-handed. */}
        <button
          aria-pressed={item.checked}
          className="flex min-h-12 w-full items-center gap-3 rounded-xl pr-2 text-left"
          type="submit"
        >
          <span
            aria-hidden="true"
            className="grid size-5 shrink-0 place-items-center rounded-md border border-border text-xs"
          >
            {item.checked ? "✓" : ""}
          </span>

          <span
            className={`min-w-0 flex-1 break-words ${
              item.checked ? "text-muted line-through" : "text-foreground"
            }`}
          >
            {item.name}
            {item.quantity > 1 ? ` × ${item.quantity}` : ""}
          </span>

          <span className="sr-only">
            {item.checked
              ? `Mark ${item.name} as needed`
              : `Mark ${item.name} as bought`}
          </span>
        </button>
      </form>

      <div className="flex shrink-0 items-center gap-2">
        {item.source !== "generated" ? (
          <span className="hidden text-xs text-muted capitalize sm:inline">
            {item.source}
          </span>
        ) : null}

        <form action={removeItem}>
          <input name="itemId" type="hidden" value={item.id} />
          <input name="weekStart" type="hidden" value={weekStart} />
          <Button size="sm" type="submit" variant="ghost">
            Remove
          </Button>
        </form>
      </div>
    </li>
  );
}
