"use client";

import { useOptimistic, useState, useTransition } from "react";
import { MoreHorizontal } from "lucide-react";
import {
  Button,
  Dropdown,
  Input,
  Label,
  Modal,
  NumberField,
  TextField,
} from "@heroui/react";

import { removeItem, toggleItemChecked, updateItem } from "../shopping.actions";
import type { ShoppingItem } from "../shopping.queries";

type Change = { id: string; kind: "toggle" } | { id: string; kind: "remove" };
type Editing = { item: ShoppingItem; mode: "quantity" | "rename" } | null;

/**
 * Shopping happens standing in an aisle, so a tick has to land now rather than after
 * a round trip. The server is still the truth: if a write fails the list re-renders
 * from it and the optimistic change disappears.
 */
export function ShoppingItems({ items }: { items: ShoppingItem[] }) {
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<Editing>(null);
  const [shown, apply] = useOptimistic(items, (current, change: Change) =>
    change.kind === "remove"
      ? current.filter((item) => item.id !== change.id)
      : current.map((item) =>
          item.id === change.id ? { ...item, checked: !item.checked } : item,
        ),
  );

  function run(change: Change, action: (data: FormData) => Promise<void>) {
    const data = new FormData();
    data.set("itemId", change.id);

    startTransition(async () => {
      apply(change);
      await action(data);
    });
  }

  return (
    <>
      <ul className="flex list-none flex-col p-0">
        {shown.map((item) => (
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

              <span className="sr-only">
                {item.checked
                  ? `Mark ${item.name} as needed`
                  : `Mark ${item.name} as bought`}
              </span>
            </button>

            <Dropdown>
              <Button
                aria-label={`Options for ${item.name}`}
                className="shrink-0"
                isIconOnly
                size="sm"
                variant="ghost"
              >
                <MoreHorizontal aria-hidden="true" className="size-4" />
              </Button>
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
                    id="delete"
                    onAction={() =>
                      run({ id: item.id, kind: "remove" }, removeItem)
                    }
                    className="text-danger"
                    textValue="Delete"
                    variant="danger"
                  >
                    Delete
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </li>
        ))}
      </ul>

      <Modal isOpen={editing !== null} onOpenChange={() => setEditing(null)}>
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
