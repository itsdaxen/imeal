import type { Metadata } from "next";

import { Button, Disclosure, Link, Typography } from "@heroui/react";

import { FillWeekForm } from "@/features/planner/components/fill-week-form";
import { ShareWeekPanel } from "@/features/planner/components/share-week-panel";
import { SharedWeekInbox } from "@/features/planner/components/shared-week-inbox";
import {
  listPlanRecipients,
  listPlansSharedWithMe,
} from "@/features/planner/plan-sharing.queries";
import { listFriends } from "@/features/friends/friend.queries";
import { WeekGrid } from "@/features/planner/components/week-grid";
import { ConfirmActionForm } from "@/components/ui/confirm-action-form";
import { ContentCard } from "@/components/ui/content-card";
import { deleteWeekPlan } from "@/features/planner/plan.actions";
import { getWeekPlan } from "@/features/planner/plan.queries";
import { generateShoppingList } from "@/features/shopping/shopping.actions";
import {
  listShoppingLists,
  resolveWeekList,
} from "@/features/shopping/shopping.queries";
import {
  addWeeks,
  formatWeekLabel,
  resolveWeekStart,
} from "@/features/planner/week";

export const metadata: Metadata = { title: "Planner" };

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const weekStart = resolveWeekStart(week);
  const [plan, sharedWithMe, friends, recipientIds, lists, destination] =
    await Promise.all([
      getWeekPlan(weekStart),
      listPlansSharedWithMe(),
      listFriends(),
      listPlanRecipients(weekStart),
      listShoppingLists(),
      resolveWeekList(weekStart),
    ]);

  return (
    <main className="flex flex-col gap-8 pt-10 sm:pt-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Typography type="h1" weight="semibold">
            Planner
          </Typography>
          <Typography className="text-muted" type="body-sm">
            {formatWeekLabel(weekStart)}
          </Typography>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {plan.planId ? (
            <ShareWeekPanel
              friends={friends}
              recipientIds={recipientIds}
              weekStart={weekStart}
            />
          ) : null}
        </div>
      </header>

      <SharedWeekInbox plans={sharedWithMe} weekStart={weekStart} />

      <div className="flex flex-wrap items-center justify-center gap-3">
        <FillWeekForm
          compact
          enabledSlots={plan.enabledSlots}
          lists={lists}
          targetListId={destination.listId}
          weekStart={weekStart}
        />

        <form action={generateShoppingList}>
          <input name="weekStart" type="hidden" value={weekStart} />
          <input name="listId" type="hidden" value={destination.listId ?? ""} />
          <Button
            className="min-h-11"
            isDisabled={plan.meals.length === 0 || !destination.listId}
            type="submit"
            variant="tertiary"
          >
            Add to shopping list
          </Button>
        </form>

        {plan.meals.length > 0 ? (
          <ConfirmActionForm
            action={deleteWeekPlan}
            confirmLabel="Empty the week"
            description="Every meal in this week goes, and anyone you shared it with loses their copy of the invitation."
            fields={{ weekStart }}
            heading="Empty this week?"
            label="Empty the week"
          />
        ) : null}
      </div>

      <ContentCard className="w-full" density="flush">
        <Disclosure>
          <Disclosure.Heading>
            <Disclosure.Trigger className="flex min-h-11 w-full items-center gap-4 px-5 py-2 text-left sm:px-6">
              <span className="font-semibold">More options</span>
              <Disclosure.Indicator />
            </Disclosure.Trigger>
          </Disclosure.Heading>

          <Disclosure.Content>
            <Disclosure.Body className="border-t border-separator px-5 py-5 sm:px-6">
              <FillWeekForm
                enabledSlots={plan.enabledSlots}
                lists={lists}
                targetListId={destination.listId}
                weekStart={weekStart}
              />
            </Disclosure.Body>
          </Disclosure.Content>
        </Disclosure>
      </ContentCard>

      <WeekGrid listId={destination.listId} plan={plan} weekStart={weekStart} />

      <nav
        aria-label="Change week"
        className="flex items-center justify-center gap-6 border-t border-separator pt-5"
      >
        <Link
          className="inline-flex min-h-11 items-center"
          href={`/planner?week=${addWeeks(weekStart, -1)}`}
        >
          Previous
        </Link>
        <Link className="inline-flex min-h-11 items-center" href="/planner">
          This week
        </Link>
        <Link
          className="inline-flex min-h-11 items-center"
          href={`/planner?week=${addWeeks(weekStart, 1)}`}
        >
          Next
        </Link>
      </nav>
    </main>
  );
}
