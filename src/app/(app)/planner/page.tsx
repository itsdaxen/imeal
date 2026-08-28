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
import {
  approveWholeWeek,
  deleteWeekPlan,
} from "@/features/planner/plan.actions";
import { getWeekPlan } from "@/features/planner/plan.queries";
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
  const [plan, sharedWithMe, friends, recipientIds] = await Promise.all([
    getWeekPlan(weekStart),
    listPlansSharedWithMe(),
    listFriends(),
    listPlanRecipients(weekStart),
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
          <nav aria-label="Change week" className="flex items-center gap-4">
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
        </div>
      </header>

      <SharedWeekInbox plans={sharedWithMe} weekStart={weekStart} />

      <ContentCard density="flush">
        <Disclosure defaultExpanded={plan.meals.length === 0}>
          <Disclosure.Heading>
            <Disclosure.Trigger className="flex min-h-16 w-full items-center gap-4 px-5 text-left sm:px-6">
              <span>
                <span className="block font-semibold">Fill automatically</span>
                <span className="block text-sm text-muted">
                  Build a fresh week from your recipe collection.
                </span>
              </span>
              <Disclosure.Indicator />
            </Disclosure.Trigger>
          </Disclosure.Heading>

          <Disclosure.Content>
            <Disclosure.Body className="border-t border-separator px-5 py-5 sm:px-6">
              <FillWeekForm
                enabledSlots={plan.enabledSlots}
                weekStart={weekStart}
              />
            </Disclosure.Body>
          </Disclosure.Content>
        </Disclosure>
      </ContentCard>

      {plan.meals.length > 0 ? (
        <section
          aria-label="Week actions"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <Typography className="text-muted" type="body-sm">
            {plan.meals.filter((meal) => meal.approved).length} of{" "}
            {plan.meals.length} planned meals approved
          </Typography>
          <div className="flex flex-wrap items-center gap-3">
            <form action={approveWholeWeek}>
              <input name="weekStart" type="hidden" value={weekStart} />
              <Button className="min-h-11" type="submit" variant="tertiary">
                Approve the whole week
              </Button>
            </form>

            <ConfirmActionForm
              action={deleteWeekPlan}
              confirmLabel="Empty the week"
              description="Every meal in this week goes, approved ones included, and anyone you shared it with loses their copy of the invitation."
              fields={{ weekStart }}
              heading="Empty this week?"
              label="Empty the week"
            />
          </div>
        </section>
      ) : null}

      <WeekGrid plan={plan} weekStart={weekStart} />
    </main>
  );
}
