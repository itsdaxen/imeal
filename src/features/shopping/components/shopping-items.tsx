"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { MoreHorizontal } from "lucide-react";
import {
  Button,
  Chip,
  Dropdown,
  Input,
  Label,
  Modal,
  NumberField,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@heroui/react";

import { ControlledDialogTrigger } from "@/components/ui/controlled-dialog-trigger";
import { IconButton } from "@/components/ui/icon-button";

import { removeItem, toggleItemChecked, updateItem } from "../shopping.actions";
import type { ShoppingItem } from "../shopping.queries";

type Change = { id: string; kind: "toggle" } | { id: string; kind: "remove" };
type Editing = { item: ShoppingItem; mode: "quantity" | "rename" } | null;
type SortMode = "added" | "alpha" | "category";

const SORTS: Array<{ id: SortMode; label: string }> = [
  { id: "added", label: "Added" },
  { id: "alpha", label: "A–Z" },
  { id: "category", label: "Category" },
];

const UNCATEGORISED = "Uncategorised";

function categoryOf(item: ShoppingItem) {
  return item.category?.trim() || UNCATEGORISED;
}

function sortItems(items: ShoppingItem[], mode: SortMode) {
  if (mode === "added") {
    return items;
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
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<Editing>(null);
  const [sort, setSort] = useState<SortMode>("added");
  const [shown, apply] = useOptimistic(items, (current, change: Change) =>
    change.kind === "remove"
      ? current.filter((item) => item.id !== change.id)
      : current.map((item) =>
          item.id === change.id ? { ...item, checked: !item.checked } : item,
        ),
  );

  const ordered = useMemo(() => sortItems(shown, sort), [shown, sort]);
  const groups = useMemo(() => {
    if (sort !== "category") {
      return null;
    }

    const found = new Map<string, ShoppingItem[]>();

    for (const item of ordered) {
      const name = categoryOf(item);
      found.set(name, [...(found.get(name) ?? []), item]);
    }

    return [...found.entries()];
  }, [ordered, sort]);

  function run(change: Change, action: (data: FormData) => Promise<void>) {
    const data = new FormData();
    data.set("itemId", change.id);

    startTransition(async () => {
      apply(change);
      await action(data);
    });
  }

  function row(item: ShoppingItem) {
    return (
      <li
        className="flex items-center justify-between gap-2 border-b border-separator last:border-b-0"
        key={item.id}
      >
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
            className={`min-w-0 flex-1 break-words ${
              item.checked ? "text-muted line-through" : "text-foreground"
            }`}
          >
            {item.name}
            {item.quantity > 1 ? ` × ${item.quantity}` : ""}
          </span>

          {/* Grouped by category the chip would repeat the heading on every row. */}
          {item.category && sort !== "category" ? (
            <Chip className="hidden sm:inline-flex" size="sm" variant="soft">
              {item.category}
            </Chip>
          ) : null}

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
        <ToggleButtonGroup
          aria-label="Sort the list"
          className="self-start"
          disallowEmptySelection
          onSelectionChange={(keys) => setSort([...keys][0] as SortMode)}
          selectedKeys={new Set([sort])}
          selectionMode="single"
          size="sm"
        >
          {SORTS.map((option) => (
            <ToggleButton id={option.id} key={option.id}>
              {option.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
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
          {ordered.map((item) => row(item))}
        </ul>
      )}

      <Modal isOpen={editing !== null} onOpenChange={() => setEditing(null)}>
        <ControlledDialogTrigger />
        <Modal.Backdrop variant="blur">
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-sm">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>
                  {editing?.mode === "quantity" ? "Change quantity" : "Rename"}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                {editing ? (
                  <form action={updateItem} className="flex items-end gap-2">
                    <input
                      name="itemId"
                      type="hidden"
                      value={editing.item.id}
                    />

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

                    <Button type="submit">Save</Button>
                  </form>
                ) : null}
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
