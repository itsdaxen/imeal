import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DayFocusProvider } from "./day-focus";
import { DayCard } from "./day-card";
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

const slot = (title: string | null) => ({
  label: "Dinner",
  slot: "dinner" as const,
  meal: title
    ? { id: `${title}-id`, title, prepMinutes: 20, approved: true }
    : null,
});

const days = [
  {
    index: 0,
    label: "Monday",
    dateLabel: "14 September",
    isToday: true,
    slots: [slot("Monday roast")],
    meals: [meal("Monday roast", "Monday")],
  },
  {
    index: 1,
    label: "Tuesday",
    dateLabel: "15 September",
    isToday: false,
    slots: [slot(null)],
    meals: [],
  },
  {
    index: 2,
    label: "Wednesday",
    dateLabel: "16 September",
    isToday: false,
    slots: [slot("Wednesday stew")],
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
      <DayCard days={days} weekStart="2026-09-14" />
    </DayFocusProvider>
  );
}

describe("focusing a day from the week", () => {
  it("shows the meals of the day you press", async () => {
    render(<Dashboard />);
    expect(screen.getAllByText("Monday roast").length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole("button", { name: /Wed/ }));

    expect(screen.getAllByText("Wednesday stew").length).toBeGreaterThan(0);
    expect(screen.queryByText("Monday roast")).toBeNull();
  });

  it("moves the day's own card along with the hero", async () => {
    render(<Dashboard />);
    expect(screen.getByText("Today")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Wed/ }));

    expect(screen.queryByText("Today")).toBeNull();
    expect(screen.getByText("16 September")).toBeInTheDocument();
    expect(screen.getByText("1 of 1 meals planned.")).toBeInTheDocument();
  });

  it("offers to plan the day being looked at", async () => {
    render(<Dashboard />);

    await userEvent.click(screen.getByRole("button", { name: /Tue/ }));

    expect(
      screen.getByText("Nothing planned for Tuesday."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Plan" })).toHaveAttribute(
      "href",
      "/planner?week=2026-09-14&day=1",
    );
  });

  it("says so when the day you press has nothing", async () => {
    render(<Dashboard />);

    await userEvent.click(screen.getByRole("button", { name: /Tue/ }));

    expect(screen.getByText("Nothing planned for Tuesday")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Plan Tuesday" })).toHaveAttribute(
      "href",
      "/planner?week=2026-09-14&day=1",
    );
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
