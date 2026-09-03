"use client";

import { useOptimistic, useTransition } from "react";
import { Button, Modal, Typography } from "@heroui/react";

import { ControlledDialogTrigger } from "@/components/ui/controlled-dialog-trigger";
import { PersonAvatar } from "@/components/ui/person-avatar";
import type { Person } from "@/features/friends/friend.queries";

import { shareRecipe, unshareRecipe } from "../sharing.actions";

/**
 * Sharing is occasional, so it lives in the recipe's menu rather than as a panel
 * under every recipe. The list stays open while you share with several people —
 * each row is its own form, so one share does not close the dialog.
 */
export function ShareDialog({
  friends,
  isOpen,
  onOpenChange,
  recipeId,
  recipientIds,
}: {
  friends: Person[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recipeId: string;
  recipientIds: string[];
}) {
  const [, startTransition] = useTransition();
  // The button flips between Share and Stop sharing, so it has to flip on press
  // rather than after the round trip — otherwise it reads as an unresponsive control.
  const [shared, toggle] = useOptimistic(
    new Set(recipientIds),
    (current, friendId: string) => {
      const next = new Set(current);
      if (next.has(friendId)) next.delete(friendId);
      else next.add(friendId);
      return next;
    },
  );

  function run(friendId: string, action: (data: FormData) => Promise<void>) {
    const data = new FormData();
    data.set("recipeId", recipeId);
    data.set("friendId", friendId);

    startTransition(async () => {
      toggle(friendId);
      await action(data);
    });
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ControlledDialogTrigger />
      <Modal.Backdrop variant="blur">
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-md">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Share this recipe</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-2">
              {friends.length === 0 ? (
                <Typography color="muted" type="body-sm">
                  Add a friend first, then you can send them recipes.
                </Typography>
              ) : (
                friends.map((friend) => {
                  const isShared = shared.has(friend.id);

                  return (
                    <div
                      className="flex items-center justify-between gap-3"
                      key={friend.id}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <PersonAvatar name={friend.displayName} />
                        <span className="truncate text-sm">
                          {friend.displayName}
                        </span>
                      </span>

                      <Button
                        onPress={() =>
                          run(friend.id, isShared ? unshareRecipe : shareRecipe)
                        }
                        size="sm"
                        type="button"
                        variant={isShared ? "ghost" : "tertiary"}
                      >
                        {isShared ? "Stop sharing" : "Share"}
                      </Button>
                    </div>
                  );
                })
              )}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
