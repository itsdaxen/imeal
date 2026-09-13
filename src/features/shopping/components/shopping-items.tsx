"use client";

import { useMemo, useOptimistic, useState } from "react";
import {
  ArrowDownAZ,
  Clock,
  type LucideIcon,
  MoreHorizontal,
  Tags,
} from "lucide-react";
import {
  Dropdown,
  Input,
  Label,
  NumberField,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@heroui/react";

import { IconButton } from "@/components/ui/icon-button";
import { PendingButton } from "@/components/ui/pending-button";

import { removeItem, toggleItemChecked, updateItem } from "../shopping.actions";
import type { ShoppingItem } from "../shopping.queries";
import { AppDialog, closing } from "@/components/ui/app-dialog";
import { type ServerAction, useServerAction } from "@/lib/use-server-action";

type Change =
  | { fields: Partial<ShoppingItem>; id: string; kind: "edit" }
  | { id: string; kind: "remove" }
  | { id: string; kind: "toggle" };
type Editing = { item: ShoppingItem; mode: "quantity" | "rename" } | null;
type SortMode = "added" | "alpha" | "category";

const SORTS: Array<{ icon: LucideIcon; id: SortMode; label: string }> = [
  { icon: Clock, id: "added", label: "Added" },
  { icon: ArrowDownAZ, id: "alpha", label: "A–Z" },
  { icon: Tags, id: "category", label: "Category" },
];

const UNCATEGORISED = "Uncategorised";

function categoryOf(item: ShoppingItem) {
  return item.category?.trim() || UNCATEGORISED;
}

export function itemAmount(item: Pick<ShoppingItem, "quantity" | "unit">) {
  if (item.unit) {
    return ` · ${item.quantity} ${item.unit}`;
  }

  return item.quantity > 1 ? ` × ${item.quantity}` : "";
}

function sortItems(items: ShoppingItem[], mode: SortMode) {
  if (mode === "added") {
    return [...items].sort(
      (left, right) =>
        new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime(),
    );
  }

  return [...items].sort((left, right) => {
    if (mode === "category") {
      const leftGroup = categoryOf(left);
      const rightGroup = categoryOf(right);

      if (leftGroup !== rightGroup) {
        // Anything uncategorised sinks, so the named groups read first.
        if (leftGroup === UNCATEGORISED) return 1;
        if (rightGroup === UNCATEGORISED) return -1;

        return leftGroup.localeCompare(rightGroup);
      }
    }

    return left.name.localeCompare(right.name, undefined, {
      sensitivity: "base",
    });
  });
}

/**
 * Shopping happens standing in an aisle, so a tick has to land now rather than after
 * a round trip. The server is still the truth: if a write fails the list re-renders
 * from it and the optimistic change disappears.
 */
export function ShoppingItems({ items }: { items: ShoppingItem[] }) {
  const { run: send } = useServerAction();
  const [editing, setEditing] = useState<Editing>(null);
  const [sort, setSort] = useState<SortMode>("added");
  const [shown, apply] = useOptimistic(items, (current, change: Change) => {
    if (change.kind === "remove") {
      return current.filter((item) => item.id !== change.id);
    }

    return current.map((item) => {
      if (item.id !== change.id) {
        return item;
      }

      return change.kind === "edit"
        ? { ...item, ...change.fields }
        : { ...item, checked: !item.checked };
    });
  });

  const ordered = useMemo(() => sortItems(shown, sort), [shown, sort]);
  const needed = ordered.filter((item) => !item.checked);
  const collected = ordered.filter((item) => item.checked);
  const groups = useMemo(() => {
    if (sort !== "category") {
      return null;
    }

    const found = new Map<string, ShoppingItem[]>();

    for (const item of needed) {
      const name = categoryOf(item);
      found.set(name, [...(found.get(name) ?? []), item]);
    }

    return [...found.entries()];
  }, [needed, sort]);

  function run(change: Change, action: ServerAction) {
    send(action, { itemId: change.id }, () => apply(change));
  }

  function row(item: ShoppingItem) {
    return (
      <li className="flex items-center justify-between gap-2" key={item.id}>
        {/* The whole row is the target, so an item can be ticked off one-handed. */}
        <button
          aria-pressed={item.checked}
          className="flex min-h-12 w-full min-w-0 flex-1 items-center gap-3 rounded-xl pr-2 text-left"
          onClick={() =>
            run({ id: item.id, kind: "toggle" }, toggleItemChecked)
          }
          type="button"
        >
          <span
            aria-hidden="true"
            className={`grid size-5 shrink-0 place-items-center rounded-md border text-xs transition-colors ${
              item.checked
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border"
            }`}
          >
            {item.checked ? "✓" : ""}
          </span>

          <span
            className={`min-w-0 break-words ${
              item.checked ? "text-muted line-through" : "text-foreground"
            }`}
          >
            {item.name}
            {itemAmount(item)}
          </span>

          <span className="flex-1" />

          <span className="sr-only">
            {item.checked
              ? `Mark ${item.name} as needed`
              : `Mark ${item.name} as bought`}
          </span>
        </button>

        <Dropdown>
          <IconButton
            className="shrink-0"
            label={`Options for ${item.name}`}
            size="sm"
            variant="ghost"
          >
            <MoreHorizontal aria-hidden="true" className="size-4" />
          </IconButton>
          <Dropdown.Popover placement="bottom end">
            <Dropdown.Menu>
              <Dropdown.Item
                id="rename"
                onAction={() => setEditing({ item, mode: "rename" })}
                textValue="Rename"
              >
                Rename
              </Dropdown.Item>
              <Dropdown.Item
                id="quantity"
                onAction={() => setEditing({ item, mode: "quantity" })}
                textValue="Change quantity"
              >
                Change quantity
              </Dropdown.Item>
              <Dropdown.Item
                className="text-danger"
                id="delete"
                onAction={() =>
                  run({ id: item.id, kind: "remove" }, removeItem)
                }
                textValue="Delete"
                variant="danger"
              >
                Delete
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </li>
    );
  }

  return (
    <>
      {shown.length > 1 ? (
        <div className="flex justify-end">
          <ToggleButtonGroup
            aria-label="Sort the list"
            disallowEmptySelection
            onSelectionChange={(keys) => setSort([...keys][0] as SortMode)}
            selectedKeys={new Set([sort])}
            selectionMode="single"
            size="sm"
          >
            {SORTS.map((option) => (
              // Below the app's 44px floor on purpose: sorting is a preference you
              // set once, not something reached for mid-aisle.
              <ToggleButton
                aria-label={option.label}
                className="min-h-9 min-w-9 px-2"
                id={option.id}
                key={option.id}
              >
                <option.icon aria-hidden="true" className="size-4" />
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>
      ) : null}

      {groups ? (
        <div className="flex flex-col gap-4">
          {groups.map(([name, group]) => (
            <section key={name}>
              <Typography
                className="mb-1 tracking-widest uppercase"
                color="muted"
                type="body-xs"
                weight="semibold"
              >
                {name}
              </Typography>
              <ul className="flex list-none flex-col p-0">
                {group.map((item) => row(item))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <ul className="flex list-none flex-col p-0">
          {needed.map((item) => row(item))}
        </ul>
      )}

      {collected.length > 0 ? (
        <section className="flex flex-col gap-1 pt-4">
          <Typography color="muted" type="body-sm" weight="semibold">
            Collected · {collected.length}
          </Typography>
          <ul className="flex list-none flex-col p-0">
            {collected.map((item) => row(item))}
          </ul>
        </section>
      ) : null}

      <Typography className="self-end pt-2" color="muted" type="body-sm">
        {shown.length} {shown.length === 1 ? "item" : "items"}
      </Typography>

      <AppDialog
        heading={editing?.mode === "quantity" ? "Change quantity" : "Rename"}
        isOpen={editing !== null}
        onOpenChange={() => setEditing(null)}
        width="sm"
      >
        {editing ? (
          <form
            // The row behind the dialog changes as the dialog goes, rather than a
            // beat later — the same reason a tick lands immediately.
            action={closing(
              (data) => {
                apply({
                  fields:
                    editing.mode === "quantity"
                      ? { quantity: Number(data.get("quantity")) }
                      : { name: String(data.get("name")) },
                  id: editing.item.id,
                  kind: "edit",
                });

                return updateItem(data);
              },
              () => setEditing(null),
            )}
            className="flex items-end gap-2"
          >
            <input name="itemId" type="hidden" value={editing.item.id} />

            {editing.mode === "quantity" ? (
              <NumberField
                className="flex-1"
                defaultValue={editing.item.quantity}
                minValue={1}
                name="quantity"
              >
                <Label>Quantity</Label>
                <Input autoFocus />
              </NumberField>
            ) : (
              <TextField
                className="flex-1"
                defaultValue={editing.item.name}
                isRequired
                name="name"
              >
                <Label>Name</Label>
                <Input autoFocus />
              </TextField>
            )}

            <PendingButton>Save</PendingButton>
          </form>
        ) : null}
      </AppDialog>
    </>
  );
}
