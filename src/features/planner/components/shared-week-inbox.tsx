"use client";

import { useOptimistic, useTransition } from "react";
import { Button } from "@heroui/react";

import { SectionTitle } from "@/components/ui/section-title";

import { copySharedWeek, dismissSharedWeek } from "../plan-sharing.actions";
import type { SharedPlan } from "../plan-sharing.queries";

type SharedWeekInboxProps = {
  plans: SharedPlan[];
  weekStart: string;
};

export function SharedWeekInbox({ plans, weekStart }: SharedWeekInboxProps) {
  const [, startTransition] = useTransition();
  // Both actions end with the invitation leaving the inbox, so it goes at once.
  const [shown, dismissPlan] = useOptimistic(plans, (current, planId: string) =>
    current.filter((plan) => plan.planId !== planId),
  );

  function run(planId: string, action: (data: FormData) => Promise<void>) {
    const data = new FormData();
    data.set("planId", planId);
    data.set("weekStart", weekStart);

    startTransition(async () => {
      dismissPlan(planId);
      await action(data);
    });
  }

  if (shown.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-accent/50 bg-accent-soft/30 p-4 sm:p-5">
      <SectionTitle>Shared with you</SectionTitle>

      <ul className="flex list-none flex-col gap-2 p-0">
        {shown.map((plan) => (
          <li
            className="flex flex-wrap items-center justify-between gap-3"
            key={plan.planId}
          >
            <span className="min-w-0">
              <span className="block font-medium">
                {plan.sharedBy}&rsquo;s week of {plan.weekStart}
              </span>
              <span className="block text-sm text-muted">
                {plan.meals} {plan.meals === 1 ? "meal" : "meals"}
              </span>
            </span>

            <div className="flex items-center gap-2">
              <Button
                className="min-h-11"
                onPress={() => run(plan.planId, copySharedWeek)}
                type="button"
                variant="tertiary"
              >
                Copy into this week
              </Button>

              <Button
                className="min-h-11"
                onPress={() => run(plan.planId, dismissSharedWeek)}
                type="button"
                variant="ghost"
              >
                Dismiss
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
