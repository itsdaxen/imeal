"use client";

import type { ReactNode } from "react";

import { useState } from "react";
import { MoreHorizontal, Share2 } from "lucide-react";
import {
  Button,
  Dropdown,
  Input,
  Label,
  Modal,
  TextField,
  Typography,
} from "@heroui/react";

import { ControlledDialogTrigger } from "@/components/ui/controlled-dialog-trigger";
import { IconButton } from "@/components/ui/icon-button";
import type { Person } from "@/features/friends/friend.queries";

import {
  addListMember,
  addStaplesToList,
  clearShoppingList,
  deleteShoppingList,
  removeListMember,
  renameShoppingList,
} from "../shopping.actions";

type Member = { displayName: string; id: string };

type ListToolbarProps = {
  /** Controls that belong with the list, rendered before the built-in ones. */
  children?: ReactNode;
  currentUserId: string;
  friends: Person[];
  isOwn: boolean;
  listId: string;
  listName: string;
  members: Member[];
};

export function ListToolbar({
  children,
  currentUserId,
  friends,
  isOwn,
  listId,
  listName,
  members,
}: ListToolbarProps) {
  const [open, setOpen] = useState<"none" | "rename" | "share">("none");
  const memberIds = new Set(members.map((member) => member.id));

  return (
    <div className="flex shrink-0 items-center gap-1">
      {children}

      <IconButton
        label="Share this list"
        onPress={() => setOpen("share")}
        variant="ghost"
      >
        <Share2 aria-hidden="true" className="size-5" />
      </IconButton>

      <Dropdown>
        <IconButton label="List options" variant="ghost">
          <MoreHorizontal aria-hidden="true" className="size-5" />
        </IconButton>
        <Dropdown.Popover placement="bottom end">
          <Dropdown.Menu>
            {isOwn ? (
              <Dropdown.Item
                id="rename"
                onAction={() => setOpen("rename")}
                textValue="Rename list"
              >
                Rename list
              </Dropdown.Item>
            ) : null}
            <Dropdown.Item
              id="staples"
              onAction={() => {
                const data = new FormData();
                data.set("listId", listId);
                void addStaplesToList(data);
              }}
              textValue="Add staples"
            >
              Add staples
            </Dropdown.Item>
            <Dropdown.Item
              id="clear"
              onAction={() => {
                const data = new FormData();
                data.set("listId", listId);
                void clearShoppingList(data);
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
                  const data = new FormData();
                  data.set("listId", listId);
                  void deleteShoppingList(data);
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

      <Modal isOpen={open === "share"} onOpenChange={() => setOpen("none")}>
        <ControlledDialogTrigger />
        <Modal.Backdrop variant="blur">
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Who shares {listName}</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-2">
                {friends.length === 0 ? (
                  <Typography color="muted" type="body-sm">
                    Add a friend first, then you can shop from the same list
                    together.
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
                        <Button size="sm" type="submit" variant="tertiary">
                          {isMember ? "Remove" : "Share"}
                        </Button>
                      </form>
                    );
                  })
                )}

                {!isOwn ? (
                  <form action={removeListMember} className="self-start">
                    <input name="listId" type="hidden" value={listId} />
                    <input name="userId" type="hidden" value={currentUserId} />
                    <Button size="sm" type="submit" variant="ghost">
                      Leave this list
                    </Button>
                  </form>
                ) : null}
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal isOpen={open === "rename"} onOpenChange={() => setOpen("none")}>
        <ControlledDialogTrigger />
        <Modal.Backdrop variant="blur">
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Rename list</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <form action={renameShoppingList} className="flex gap-2">
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
                  <Button className="self-end" type="submit">
                    Save
                  </Button>
                </form>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
