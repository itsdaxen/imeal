import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DayFocusProvider } from "./day-focus";
import { NextMealSlider } from "./next-meal-slider";
import { PlanningDay } from "./planning-day";

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span>{alt}</span>,
}));

const meal = (title: string, dayLabel: string) => ({
  approved: true,
  dayLabel,
  id: `${title}-id`,
  imageUrl: null,
  prepMinutes: 20,
  slot: "dinner" as const,
  title,
});

const days = [
  { index: 0, label: "Monday", meals: [meal("Monday roast", "Monday")] },
  { index: 1, label: "Tuesday", meals: [] },
  {
    index: 2,
    label: "Wednesday",
    meals: [meal("Wednesday stew", "Wednesday")],
  },
];

function Dashboard({ initialDay = 0 }: { initialDay?: number }) {
  return (
    <DayFocusProvider initialDay={initialDay}>
      <ol>
        {days.map((day) => (
          <PlanningDay
            date={day.index + 14}
            dayIndex={day.index}
            hasMeal={day.meals.length > 0}
            isToday={day.index === 0}
            key={day.index}
            label={day.label.slice(0, 3)}
          />
        ))}
      </ol>
      <NextMealSlider days={days} weekStart="2026-09-14" />
    </DayFocusProvider>
  );
}

describe("focusing a day from the week", () => {
  it("shows the meals of the day you press", async () => {
    render(<Dashboard />);
    expect(screen.getByText("Monday roast")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Wed/ }));

    expect(screen.getByText("Wednesday stew")).toBeInTheDocument();
    expect(screen.queryByText("Monday roast")).toBeNull();
  });

  it("says so when the day you press has nothing", async () => {
    render(<Dashboard />);

    await userEvent.click(screen.getByRole("button", { name: /Tue/ }));

    expect(screen.getByText("Nothing planned for Tuesday")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Plan Tuesday" }),
    ).toHaveAttribute("href", "/planner?week=2026-09-14&day=1");
  });

  it("marks the focused day apart from today", async () => {
    render(<Dashboard />);

    await userEvent.click(screen.getByRole("button", { name: /Wed/ }));

    expect(screen.getByRole("button", { name: /Wed/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /Mon/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
