"use client";

import type { ReactNode } from "react";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Dropdown, Input, Label, TextField, Typography } from "@heroui/react";

import { IconButton } from "@/components/ui/icon-button";
import { PendingButton } from "@/components/ui/pending-button";
import type { Person } from "@/features/friends/friend.queries";

import {
  addListMember,
  addStaplesToList,
  clearShoppingList,
  deleteShoppingList,
  removeListMember,
  renameShoppingList,
} from "../shopping.actions";
import { AppDialog, closing } from "@/components/ui/app-dialog";
import { useServerAction } from "@/lib/use-server-action";

type Member = { displayName: string; id: string };

type ListToolbarProps = {
  /** Controls that belong with the list, rendered before the built-in ones. */
  children?: ReactNode;
  currentUserId: string;
  friends: Person[];
  hasStaples: boolean;
  isOwn: boolean;
  listId: string;
  listName: string;
  members: Member[];
  /** How many staples are not already on this list. */
  staplesToAdd: number;
};

export function ListToolbar({
  children,
  currentUserId,
  friends,
  hasStaples,
  isOwn,
  listId,
  listName,
  members,
  staplesToAdd,
}: ListToolbarProps) {
  const { run } = useServerAction();
  const [open, setOpen] = useState<"none" | "rename" | "share">("none");
  const memberIds = new Set(members.map((member) => member.id));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {children}

      <Dropdown>
        <IconButton label="List options" variant="tertiary">
          <MoreHorizontal aria-hidden="true" className="size-4" />
        </IconButton>
        <Dropdown.Popover placement="bottom end">
          <Dropdown.Menu>
            <Dropdown.Item
              id="share"
              onAction={() => setOpen("share")}
              textValue="Share list"
            >
              Share list
            </Dropdown.Item>
            {isOwn ? (
              <Dropdown.Item
                id="rename"
                onAction={() => setOpen("rename")}
                textValue="Rename list"
              >
                Rename list
              </Dropdown.Item>
            ) : null}
            {/* Saying what will happen beats a menu item that looks live and does
                nothing, so the action only appears when there is something to add
                and says how much. */}
            {hasStaples ? (
              <Dropdown.Item
                id="staples"
                isDisabled={staplesToAdd === 0}
                onAction={() => {
                  run(addStaplesToList, { listId });
                }}
                textValue={
                  staplesToAdd === 0
                    ? "Staples already on this list"
                    : `Add ${staplesToAdd} staples`
                }
              >
                {staplesToAdd === 0
                  ? "Staples already on this list"
                  : `Add ${staplesToAdd} ${staplesToAdd === 1 ? "staple" : "staples"}`}
              </Dropdown.Item>
            ) : null}

            {/* The way to the staples themselves, always — it is the only route to
                that page, and hiding it once you own staples strands you there. */}
            <Dropdown.Item
              href="/shopping/staples"
              id="edit-staples"
              textValue={hasStaples ? "Edit staples" : "Set up staples"}
            >
              {hasStaples ? "Edit staples" : "Set up staples"}
            </Dropdown.Item>
            <Dropdown.Item
              id="clear"
              onAction={() => {
                run(clearShoppingList, { listId });
              }}
              className="text-danger"
              textValue="Clear list"
              variant="danger"
            >
              Clear list
            </Dropdown.Item>
            {isOwn ? (
              <Dropdown.Item
                id="delete"
                onAction={() => {
                  run(deleteShoppingList, { listId });
                }}
                className="text-danger"
                textValue="Delete list"
                variant="danger"
              >
                Delete list
              </Dropdown.Item>
            ) : null}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>

      <AppDialog
        bodyClassName="flex flex-col gap-2"
        heading={<>Who shares {listName}</>}
        isOpen={open === "share"}
        onOpenChange={() => setOpen("none")}
      >
        {friends.length === 0 ? (
          <Typography color="muted" type="body-sm">
            Add a friend first, then you can shop from the same list together.
          </Typography>
        ) : (
          friends.map((friend) => {
            const isMember = memberIds.has(friend.id);

            return (
              <form
                action={isMember ? removeListMember : addListMember}
                className="flex items-center justify-between gap-3"
                key={friend.id}
              >
                <input name="listId" type="hidden" value={listId} />
                <input name="userId" type="hidden" value={friend.id} />
                <span className="text-sm">{friend.displayName}</span>
                <PendingButton className="min-h-11" variant="tertiary">
                  {isMember ? "Remove" : "Share"}
                </PendingButton>
              </form>
            );
          })
        )}

        {!isOwn ? (
          <form action={removeListMember} className="self-start">
            <input name="listId" type="hidden" value={listId} />
            <input name="userId" type="hidden" value={currentUserId} />
            <PendingButton className="min-h-11" variant="ghost">
              Leave this list
            </PendingButton>
          </form>
        ) : null}
      </AppDialog>

      <AppDialog
        heading="Rename list"
        isOpen={open === "rename"}
        onOpenChange={() => setOpen("none")}
      >
        <form
          action={closing(renameShoppingList, () => setOpen("none"))}
          className="flex gap-2"
        >
          <input name="listId" type="hidden" value={listId} />
          <TextField
            className="flex-1"
            defaultValue={listName}
            isRequired
            name="name"
          >
            <Label>Name</Label>
            <Input autoFocus />
          </TextField>
          <PendingButton className="self-end">Save</PendingButton>
        </form>
      </AppDialog>
    </div>
  );
}
