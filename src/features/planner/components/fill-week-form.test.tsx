import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FillWeekForm, PlanGenerationSettingsProvider } from "./fill-week-form";

vi.mock("../plan.actions", () => ({
  generateWeekPlan: vi.fn(async () => ({})),
}));

const day = ["breakfast", "lunch", "snack", "dinner"] as const;
const props = {
  day,
  lists: [],
  targetListId: null,
  weekStart: "2026-09-14",
};

describe("FillWeekForm", () => {
  it("submits the visible meal choices from the top Generate button", async () => {
    const user = userEvent.setup();
    const view = render(
      <PlanGenerationSettingsProvider day={day} targetListId={null}>
        <FillWeekForm compact {...props} />
        <FillWeekForm {...props} />
      </PlanGenerationSettingsProvider>,
    );

    await user.click(screen.getByRole("checkbox", { name: "dinner" }));

    const compactForm = view.container.querySelector("form");
    expect(compactForm).not.toBeNull();
    const submittedSlots = new FormData(compactForm!).getAll("slots");

    expect(submittedSlots).toEqual(["breakfast", "lunch", "snack"]);
    expect(submittedSlots).not.toContain("dinner");
    expect(new FormData(compactForm!).has("mealsPerDay")).toBe(false);
  });
});
