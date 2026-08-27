import { Card, Typography } from "@heroui/react";

import { ContentCard } from "@/components/ui/content-card";

import { mealAt, type WeekPlan } from "../plan.queries";
import { weekDays } from "../week";
import { SlotCell } from "./slot-cell";

type WeekGridProps = {
  plan: WeekPlan;
  weekStart: string;
};

export function WeekGrid({ plan, weekStart }: WeekGridProps) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-7 xl:gap-3">
      {weekDays(weekStart).map((day) => (
        <ContentCard className="h-full" density="compact" key={day.date}>
          <Card.Header>
            <Typography className="xl:text-lg" type="h2" weight="semibold">
              {day.label}
            </Typography>
            <Typography className="text-muted" type="body-xs">
              {day.dateLabel}
            </Typography>
          </Card.Header>

          <Card.Content>
            <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {plan.enabledSlots.map((slot) => (
                <SlotCell
                  dayIndex={day.index}
                  key={slot}
                  meal={mealAt(plan, day.index, slot)}
                  slot={slot}
                  weekStart={weekStart}
                />
              ))}
            </div>
          </Card.Content>
        </ContentCard>
      ))}
    </div>
  );
}
