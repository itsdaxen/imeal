"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { Button, Modal, Typography } from "@heroui/react";

import { ControlledDialogTrigger } from "@/components/ui/controlled-dialog-trigger";
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
  const [isOpen, setIsOpen] = useState(false);

  if (friends.length === 0) {
    return null;
  }

  const shared = new Set(recipientIds);

  return (
    <>
      <Button
        className="min-h-11"
        onPress={() => setIsOpen(true)}
        variant="tertiary"
      >
        <Users aria-hidden="true" className="size-4" />
        Share week{recipientIds.length > 0 ? ` · ${recipientIds.length}` : ""}
      </Button>

      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <ControlledDialogTrigger />
        <Modal.Backdrop variant="blur">
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Share this week</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-4">
                <Typography color="muted" type="body-sm">
                  Friends can read the plan and copy it with its recipes.
                </Typography>
                <ul className="flex list-none flex-col p-0">
                  {friends.map((friend) => {
                    const isShared = shared.has(friend.id);

                    return (
                      <li
                        className="flex min-h-14 items-center justify-between gap-4 border-b border-separator last:border-b-0"
                        key={friend.id}
                      >
                        <span>{friend.displayName}</span>
                        <form action={isShared ? unshareWeek : shareWeek}>
                          <input
                            name="weekStart"
                            type="hidden"
                            value={weekStart}
                          />
                          <input
                            name="friendId"
                            type="hidden"
                            value={friend.id}
                          />
                          <Button
                            className="min-h-11"
                            type="submit"
                            variant={isShared ? "ghost" : "tertiary"}
                          >
                            {isShared ? "Stop sharing" : "Share"}
                          </Button>
                        </form>
                      </li>
                    );
                  })}
                </ul>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
