import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, toast } from "@heroui/react";

import { AppRouterProvider } from "./app-router-provider";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("the toast region", () => {
  // Mounted once at the root, so anything anywhere can raise a message that is drawn
  // above the page rather than inside whatever card asked for it.
  it("shows a message raised from anywhere in the app", async () => {
    render(
      <AppRouterProvider>
        <Button onPress={() => toast.danger("Nothing to cook with.")}>
          Raise
        </Button>
      </AppRouterProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Raise" }));

    expect(await screen.findByText("Nothing to cook with.")).toBeVisible();
  });
});
