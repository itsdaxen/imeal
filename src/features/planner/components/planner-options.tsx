"use client";

import { useRef, useState } from "react";
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
  const shared = new Set(recipientIds);

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
