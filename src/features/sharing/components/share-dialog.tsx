"use client";

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
  const shared = new Set(recipientIds);

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
                    <form
                      action={isShared ? unshareRecipe : shareRecipe}
                      className="flex items-center justify-between gap-3"
                      key={friend.id}
                    >
                      <input name="recipeId" type="hidden" value={recipeId} />
                      <input name="friendId" type="hidden" value={friend.id} />

                      <span className="flex min-w-0 items-center gap-3">
                        <PersonAvatar name={friend.displayName} />
                        <span className="truncate text-sm">
                          {friend.displayName}
                        </span>
                      </span>

                      <Button
                        size="sm"
                        type="submit"
                        variant={isShared ? "ghost" : "tertiary"}
                      >
                        {isShared ? "Stop sharing" : "Share"}
                      </Button>
                    </form>
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
