import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CookingSession } from "./cooking-session";

const ingredients = ["Pasta", "Tomatoes"];
const steps = ["Boil the water", "Cook the pasta", "Serve"];

function setup() {
  return {
    user: userEvent.setup(),
    ...render(<CookingSession ingredients={ingredients} steps={steps} />),
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("CookingSession", () => {
  it("starts on the first step with Back unavailable", () => {
    setup();

    expect(
      within(screen.getByTestId("current-step")).getByText("Boil the water"),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Step 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
  });

  it("walks forward and back through the steps", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(
      within(screen.getByTestId("current-step")).getByText("Cook the pasta"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(
      within(screen.getByTestId("current-step")).getByText("Boil the water"),
    ).toBeInTheDocument();
  });

  it("stops at the last step", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(
      within(screen.getByTestId("current-step")).getByText("Serve"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Finished" })).toBeDisabled();
  });

  it("toggles an ingredient without affecting the others", async () => {
    const { user } = setup();
    const pasta = screen.getByRole("button", { name: /Pasta/ });
    const tomatoes = screen.getByRole("button", { name: /Tomatoes/ });

    expect(pasta).toHaveAttribute("aria-pressed", "false");

    await user.click(pasta);
    expect(pasta).toHaveAttribute("aria-pressed", "true");
    expect(tomatoes).toHaveAttribute("aria-pressed", "false");

    await user.click(pasta);
    expect(pasta).toHaveAttribute("aria-pressed", "false");
  });

  it("opens any step directly and updates progress", async () => {
    const { user } = setup();

    await user.click(
      screen.getByRole("button", { name: "Go to step 3: Serve" }),
    );

    expect(screen.getByRole("heading", { name: "Step 3" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
    expect(
      screen.getByRole("button", { name: "Go to step 3: Serve" }),
    ).toHaveAttribute("aria-current", "step");
  });

  it("starts, pauses, resumes, and resets elapsed time", async () => {
    vi.useFakeTimers();
    render(<CookingSession ingredients={ingredients} steps={steps} />);

    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    await act(() => vi.advanceTimersByTimeAsync(65_000));
    expect(screen.getByText("01:05")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    await act(() => vi.advanceTimersByTimeAsync(5_000));
    expect(screen.getByText("01:05")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Resume" }));
    await act(() => vi.advanceTimersByTimeAsync(2_000));
    expect(screen.getByText("01:07")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByText("00:00")).toBeInTheDocument();
  });

  it("shows a recipe tip only when one is provided", () => {
    const { rerender } = render(
      <CookingSession
        ingredients={ingredients}
        steps={steps}
        tip="Salt later."
      />,
    );

    expect(screen.getByRole("heading", { name: "Tip" })).toBeInTheDocument();
    expect(screen.getByText("Salt later.")).toBeInTheDocument();

    rerender(
      <CookingSession ingredients={ingredients} steps={steps} tip={null} />,
    );
    expect(
      screen.queryByRole("heading", { name: "Tip" }),
    ).not.toBeInTheDocument();
  });
});
