import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FillWeekForm, PlanGenerationSettingsProvider } from "./fill-week-form";

vi.mock("../plan.actions", () => ({
  generateWeekPlan: vi.fn(async () => ({})),
}));

vi.mock("@heroui/react", async () => {
  const actual =
    await vi.importActual<typeof import("@heroui/react")>("@heroui/react");

  return { ...actual, toast: { ...actual.toast, danger: vi.fn() } };
});

const { toast } = await import("@heroui/react");

const { generateWeekPlan } = await import("../plan.actions");

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
    expect(new FormData(compactForm!).get("mealsPerDay")).toBe("3");
  });

  it("lets the meal count add repeated selected kinds", async () => {
    const user = userEvent.setup();
    const view = render(
      <PlanGenerationSettingsProvider day={day} targetListId={null}>
        <FillWeekForm compact {...props} />
        <FillWeekForm {...props} />
      </PlanGenerationSettingsProvider>,
    );

    await user.click(screen.getByRole("checkbox", { name: "dinner" }));
    const count = screen.getByRole("spinbutton", { name: "Meals per day" });
    await user.clear(count);
    await user.type(count, "4");

    const compactForm = view.container.querySelector("form");
    expect(compactForm).not.toBeNull();
    expect(new FormData(compactForm!).get("mealsPerDay")).toBe("4");
    expect(
      screen.getByText("A day runs Breakfast, Lunch 1, Snack, Lunch 2."),
    ).toBeInTheDocument();
  });

  // The compact form is a lone button with nowhere to print a sentence, so the
  // reason a week could not be filled is raised rather than returned.
  it("raises why a week could not be filled", async () => {
    const user = userEvent.setup();
    vi.mocked(generateWeekPlan).mockResolvedValueOnce({
      error: "Only 1 dinner recipes are available, and 7 are needed.",
    });

    render(
      <PlanGenerationSettingsProvider day={day} targetListId={null}>
        <FillWeekForm compact {...props} />
      </PlanGenerationSettingsProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Generate plan" }));

    await vi.waitFor(() =>
      expect(toast.danger).toHaveBeenCalledWith(
        "Only 1 dinner recipes are available, and 7 are needed.",
      ),
    );
  });

  it("says nothing when a week fills", async () => {
    const user = userEvent.setup();
    vi.mocked(toast.danger).mockClear();

    render(
      <PlanGenerationSettingsProvider day={day} targetListId={null}>
        <FillWeekForm compact {...props} />
      </PlanGenerationSettingsProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Generate plan" }));

    expect(toast.danger).not.toHaveBeenCalled();
  });
});
