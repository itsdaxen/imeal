import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { WeekGrid } from "./week-grid";
import { DEFAULT_DAY, sameEveryDay } from "../day-shape";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("week=2026-09-07"),
}));

vi.mock("@/lib/use-server-action", () => ({
  useServerAction: () => ({ isPending: false, run: vi.fn() }),
}));

const plan = {
  days: sameEveryDay(DEFAULT_DAY),
  meals: [],
  planId: "plan",
};

beforeEach(() => {
  window.history.replaceState(null, "", "/planner?week=2026-09-07");
});

describe("WeekGrid", () => {
  it("puts the day you switch to in the address, without reloading", async () => {
    render(<WeekGrid day="0" plan={plan} view="day" weekStart="2026-09-07" />);

    await userEvent.click(screen.getByRole("tab", { name: /Thu/ }));

    expect(new URLSearchParams(window.location.search).get("day")).toBe("3");
  });

  it("keeps the week it was already showing", async () => {
    render(<WeekGrid day="0" plan={plan} view="day" weekStart="2026-09-07" />);

    await userEvent.click(screen.getByRole("tab", { name: /Wed/ }));

    expect(new URLSearchParams(window.location.search).get("week")).toBe(
      "2026-09-07",
    );
  });

  it("opens on the day it was given", () => {
    render(<WeekGrid day="5" plan={plan} view="day" weekStart="2026-09-07" />);

    expect(screen.getByRole("tab", { name: /Sat/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
