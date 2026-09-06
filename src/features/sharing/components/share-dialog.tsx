"use client";

import { Button, Typography } from "@heroui/react";

import { PersonAvatar } from "@/components/ui/person-avatar";
import type { Person } from "@/features/friends/friend.queries";

import { shareRecipe, unshareRecipe } from "../sharing.actions";
import { AppDialog } from "@/components/ui/app-dialog";
import { type ServerAction, useServerAction } from "@/lib/use-server-action";
import { useOptimisticSet } from "@/lib/use-optimistic-set";

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
  const { run: send } = useServerAction();
  // The button flips between Share and Stop sharing, so it has to flip on press
  // rather than after the round trip — otherwise it reads as an unresponsive control.
  const [shared, toggle] = useOptimisticSet(recipientIds);

  function run(friendId: string, action: ServerAction) {
    send(action, { friendId, recipeId }, () => toggle(friendId));
  }

  return (
    <AppDialog
      bodyClassName="flex flex-col gap-2"
      heading="Share this recipe"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
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
                <span className="truncate text-sm">{friend.displayName}</span>
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
    </AppDialog>
  );
}
