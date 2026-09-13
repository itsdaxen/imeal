"use client";

import { Card, Chip, cn } from "@heroui/react";

import { ActionLink } from "@/components/ui/action";
import { ContentCard } from "@/components/ui/content-card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PanelTitle } from "@/components/ui/panel-title";
import { span } from "@/components/ui/page-grid";

import type { DashboardData } from "../dashboard.queries";
import { useDayFocus } from "./day-focus";

type Day = DashboardData["plannedDays"][number];

/**
 * Every meal of one day, planned or still waiting.
 *
 * The old app's home screen answered "what am I cooking today" first, and this is that
 * answer — but it follows the day you press in the week rather than staying on today,
 * because a card showing Monday beside a hero showing Thursday is two answers to the
 * same question.
 */
export function DayCard({
  days,
  weekStart,
}: {
  days: Day[];
  weekStart: string;
}) {
  const { day } = useDayFocus();
  const focused = days.find((entry) => entry.index === day) ?? days[0];

  if (!focused) {
    return null;
  }

  const planned = focused.slots.filter((entry) => entry.meal !== null).length;
  const planHref = `/planner?week=${weekStart}&day=${focused.index}`;

  return (
    <ContentCard className={cn(span.narrow, "gap-5")} id="today">
      <Card.Header className="gap-1">
        <Eyebrow>{focused.isToday ? "Today" : focused.dateLabel}</Eyebrow>
        <PanelTitle>{focused.label}</PanelTitle>
        <Card.Description>
          {planned === 0
            ? `Nothing planned for ${focused.isToday ? "today" : focused.label}.`
            : `${planned} of ${focused.slots.length} meals planned.`}
        </Card.Description>
      </Card.Header>

      <Card.Content>
        <ul className="flex list-none flex-col p-0">
          {focused.slots.map(({ label, meal }, slotIndex) => (
            // Keyed by position: a day can hold two lunches, so the kind of meal is
            // not what tells one row from another.
            <li
              className="flex min-h-12 items-center justify-between gap-3 border-b border-separator last:border-b-0"
              key={slotIndex}
            >
              <span className="min-w-0">
                <span className="block text-xs font-medium text-muted capitalize">
                  {label}
                </span>
                <span className="block truncate text-sm">
                  {meal ? meal.title : "Not planned"}
                </span>
              </span>

              <span className="flex shrink-0 items-center gap-2">
                {meal ? (
                  <Chip
                    color={meal.approved ? "accent" : "default"}
                    size="sm"
                    variant="soft"
                  >
                    {meal.approved ? "Ready" : "Draft"}
                  </Chip>
                ) : null}
                <ActionLink
                  className="text-sm"
                  href={meal?.approved ? `/cook/${meal.id}` : planHref}
                  tier="quiet"
                >
                  {meal ? (meal.approved ? "Cook" : "Review") : "Plan"}
                </ActionLink>
              </span>
            </li>
          ))}
        </ul>
      </Card.Content>
    </ContentCard>
  );
}
