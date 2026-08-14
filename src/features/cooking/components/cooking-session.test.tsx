import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CookingSession } from "./cooking-session";

const ingredients = ["Pasta", "Tomatoes"];
const steps = ["Boil the water", "Cook the pasta", "Serve"];

function setup() {
  return {
    user: userEvent.setup(),
    ...render(<CookingSession ingredients={ingredients} steps={steps} />),
  };
}

describe("CookingSession", () => {
  it("starts on the first step with Back unavailable", () => {
    setup();

    expect(screen.getByText("Boil the water")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Step 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
  });

  it("walks forward and back through the steps", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Cook the pasta")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("Boil the water")).toBeInTheDocument();
  });

  it("stops at the last step", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Serve")).toBeInTheDocument();
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
});
