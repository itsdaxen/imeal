import { Button, Typography } from "@heroui/react";

import type { Person } from "@/features/friends/friend.queries";

import { shareRecipe, unshareRecipe } from "../sharing.actions";

type SharePanelProps = {
  friends: Person[];
  recipeId: string;
  recipientIds: string[];
};

export function SharePanel({
  friends,
  recipeId,
  recipientIds,
}: SharePanelProps) {
  if (friends.length === 0) {
    return null;
  }

  const shared = new Set(recipientIds);

  return (
    <section className="flex flex-col gap-3 border-t border-border/60 pt-6">
      <Typography type="h2" weight="semibold">
        Share with a friend
      </Typography>

      <ul className="flex list-none flex-col p-0">
        {friends.map((friend) => {
          const isShared = shared.has(friend.id);

          return (
            <li
              className="flex items-center justify-between gap-4 border-b border-border/60 py-2.5"
              key={friend.id}
            >
              <span>{friend.displayName}</span>

              <form action={isShared ? unshareRecipe : shareRecipe}>
                <input name="recipeId" type="hidden" value={recipeId} />
                <input name="friendId" type="hidden" value={friend.id} />
                <Button
                  size="sm"
                  type="submit"
                  variant={isShared ? "ghost" : "secondary"}
                >
                  {isShared ? "Stop sharing" : "Share"}
                </Button>
              </form>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
