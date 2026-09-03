"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button, Dropdown, Link, Modal, Typography } from "@heroui/react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ControlledDialogTrigger } from "@/components/ui/controlled-dialog-trigger";
import { IconButton } from "@/components/ui/icon-button";
import type { Person } from "@/features/friends/friend.queries";

import { deleteWeekPlan } from "../plan.actions";
import { shareWeek, unshareWeek } from "../plan-sharing.actions";

type PlannerOptionsProps = {
  friends: Person[];
  hasMeals: boolean;
  recipientIds: string[];
  weekStart: string;
};

export function PlannerOptions({
  friends,
  hasMeals,
  recipientIds,
  weekStart,
}: PlannerOptionsProps) {
  const [dialog, setDialog] = useState<"clear" | "share" | null>(null);
  const clearForm = useRef<HTMLFormElement>(null);
  const [, startTransition] = useTransition();
  // Same reasoning as sharing a recipe: the label flips, so it flips on press.
  const [shared, toggleShared] = useOptimistic(
    new Set(recipientIds),
    (current, friendId: string) => {
      const next = new Set(current);
      if (next.has(friendId)) next.delete(friendId);
      else next.add(friendId);
      return next;
    },
  );

  function runShare(
    friendId: string,
    action: (data: FormData) => Promise<void>,
  ) {
    const data = new FormData();
    data.set("weekStart", weekStart);
    data.set("friendId", friendId);

    startTransition(async () => {
      toggleShared(friendId);
      await action(data);
    });
  }

  return (
    <>
      <Dropdown>
        <IconButton label="Planner options" variant="ghost">
          <MoreHorizontal aria-hidden="true" className="size-5" />
        </IconButton>
        <Dropdown.Popover placement="bottom end">
          <Dropdown.Menu>
            <Dropdown.Item
              id="share"
              isDisabled={friends.length === 0}
              onAction={() => setDialog("share")}
              textValue="Share week plan"
            >
              Share week plan
            </Dropdown.Item>
            <Dropdown.Item
              className="text-danger"
              id="clear"
              isDisabled={!hasMeals}
              onAction={() => setDialog("clear")}
              textValue="Clear plan"
              variant="danger"
            >
              Clear plan
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>

      <Modal
        isOpen={dialog === "share"}
        onOpenChange={(open) => setDialog(open ? "share" : null)}
      >
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
                        <Button
                          className="min-h-11"
                          onPress={() =>
                            runShare(
                              friend.id,
                              isShared ? unshareWeek : shareWeek,
                            )
                          }
                          type="button"
                          variant={isShared ? "ghost" : "tertiary"}
                        >
                          {isShared ? "Stop sharing" : "Share"}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
                <Link className="self-start" href="/friends">
                  Manage friends
                </Link>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <form action={deleteWeekPlan} ref={clearForm}>
        <input name="weekStart" type="hidden" value={weekStart} />
      </form>
      <ConfirmDialog
        confirmLabel="Clear plan"
        description="Every meal in this week goes, and anyone you shared it with loses their invitation."
        heading="Clear this plan?"
        isOpen={dialog === "clear"}
        onConfirm={() => {
          setDialog(null);
          clearForm.current?.requestSubmit();
        }}
        onOpenChange={(open) => setDialog(open ? "clear" : null)}
      />
    </>
  );
}
