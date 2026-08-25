import { Button, Input, Label, TextField, Typography } from "@heroui/react";

import type { Person } from "@/features/friends/friend.queries";
import { ConfirmActionForm } from "@/components/ui/confirm-action-form";

import {
  addListMember,
  createShoppingList,
  deleteShoppingList,
  removeListMember,
} from "../shopping.actions";
import type { ShoppingListSummary } from "../shopping.queries";

type ListPanelProps = {
  friends: Person[];
  listId: string | null;
  lists: ShoppingListSummary[];
  members: Array<{ id: string; displayName: string }>;
  currentUserId: string;
};

export function ListPanel({
  friends,
  listId,
  lists,
  members,
  currentUserId,
}: ListPanelProps) {
  const current = lists.find((list) => list.id === listId);
  const memberIds = new Set(members.map((member) => member.id));

  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-border/80 p-4 sm:p-5">
      <div className="flex flex-col gap-3">
        <Typography type="h2" weight="semibold">
          Lists
        </Typography>

        <form
          action={createShoppingList}
          className="flex flex-wrap items-end gap-3"
        >
          <TextField className="min-w-48 flex-1" isRequired name="name">
            <Label>New list</Label>
            <Input placeholder="Market, party, the other house" />
          </TextField>
          <Button size="sm" type="submit" variant="tertiary">
            Create
          </Button>
        </form>
      </div>

      {current?.isOwn && listId ? (
        <div className="flex flex-col gap-3 border-t border-border/60 pt-4">
          <Typography type="h2" weight="semibold">
            Who shares {current.name}
          </Typography>

          {friends.length === 0 ? (
            <Typography className="text-muted" type="body-sm">
              Add a friend and you can shop from the same list together.
            </Typography>
          ) : (
            <ul className="flex list-none flex-col p-0">
              {friends.map((friend) => {
                const isMember = memberIds.has(friend.id);

                return (
                  <li
                    className="flex min-h-12 items-center justify-between gap-4 border-b border-border/60 last:border-b-0"
                    key={friend.id}
                  >
                    <span>{friend.displayName}</span>

                    <form action={isMember ? removeListMember : addListMember}>
                      <input name="listId" type="hidden" value={listId} />
                      <input name="userId" type="hidden" value={friend.id} />
                      <Button
                        size="sm"
                        type="submit"
                        variant={isMember ? "ghost" : "secondary"}
                      >
                        {isMember ? "Remove" : "Add"}
                      </Button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}

          {!current.isDefault ? (
            <ConfirmActionForm
              action={deleteShoppingList}
              confirmLabel="Delete list"
              description={`Delete “${current.name}” and all its items for everyone sharing it? This cannot be undone.`}
              fields={{ listId }}
              heading="Delete this list?"
              label="Delete this list"
            />
          ) : null}
        </div>
      ) : null}

      {current && !current.isOwn ? (
        <form action={removeListMember} className="self-start">
          <input name="listId" type="hidden" value={current.id} />
          <input name="userId" type="hidden" value={currentUserId} />
          <Button size="sm" type="submit" variant="ghost">
            Leave this list
          </Button>
        </form>
      ) : null}
    </section>
  );
}
