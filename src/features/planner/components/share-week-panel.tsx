import { Button, Typography } from "@heroui/react";

import type { Person } from "@/features/friends/friend.queries";

import { shareWeek, unshareWeek } from "../plan-sharing.actions";

type ShareWeekPanelProps = {
  friends: Person[];
  recipientIds: string[];
  weekStart: string;
};

export function ShareWeekPanel({
  friends,
  recipientIds,
  weekStart,
}: ShareWeekPanelProps) {
  if (friends.length === 0) {
    return null;
  }

  const shared = new Set(recipientIds);

  return (
    <section className="flex flex-col gap-3 border-t border-border/60 pt-6">
      <Typography type="h2" weight="semibold">
        Share this week
      </Typography>
      <Typography className="text-muted" type="body-sm">
        They can read it and take a copy. The recipes in it come with it.
      </Typography>

      <ul className="flex list-none flex-col p-0">
        {friends.map((friend) => {
          const isShared = shared.has(friend.id);

          return (
            <li
              className="flex min-h-12 items-center justify-between gap-4 border-b border-border/60 last:border-b-0"
              key={friend.id}
            >
              <span>{friend.displayName}</span>

              <form action={isShared ? unshareWeek : shareWeek}>
                <input name="weekStart" type="hidden" value={weekStart} />
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
