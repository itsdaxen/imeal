import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ListToolbar } from "./list-toolbar";

vi.mock("../shopping.actions", () => ({
  addListMember: vi.fn(),
  addStaplesToList: vi.fn(),
  clearShoppingList: vi.fn(),
  deleteShoppingList: vi.fn(),
  removeListMember: vi.fn(),
  renameShoppingList: vi.fn(),
  setDefaultList: vi.fn(),
}));

const run = vi.fn();

vi.mock("@/lib/use-server-action", () => ({
  useServerAction: () => ({ isPending: false, run }),
}));

async function openMenu(over: { isDefault?: boolean; isOwn?: boolean } = {}) {
  render(
    <ListToolbar
      currentUserId="me"
      friends={[]}
      hasStaples={false}
      isDefault={false}
      isOwn
      listId="list"
      listName="Shopping"
      members={[]}
      staplesToAdd={0}
      {...over}
    />,
  );

  await userEvent.click(screen.getByRole("button", { name: /list options/i }));
}

describe("the list menu", () => {
  it("offers to delete a list that is not the default", async () => {
    await openMenu();

    expect(screen.getByRole("menuitem", { name: "Delete list" })).toBeVisible();
  });

  // Which list is the default is a detail the app keeps straight by itself, so it is
  // no reason to refuse to throw a list away.
  it("offers to delete the default list too", async () => {
    await openMenu({ isDefault: true });

    expect(screen.getByRole("menuitem", { name: "Delete list" })).toBeVisible();
  });

  it("lets any list of yours be renamed", async () => {
    await openMenu({ isDefault: true });

    expect(screen.getByRole("menuitem", { name: "Rename list" })).toBeVisible();
  });

  it("offers neither on a list somebody else owns", async () => {
    await openMenu({ isOwn: false });

    expect(screen.queryByRole("menuitem", { name: "Delete list" })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: "Rename list" })).toBeNull();
  });
});

describe("deleting a list", () => {
  it("asks before it does it", async () => {
    run.mockClear();
    await openMenu();

    await userEvent.click(
      screen.getByRole("menuitem", { name: "Delete list" }),
    );

    expect(screen.getByRole("alertdialog")).toBeVisible();
    expect(run).not.toHaveBeenCalled();
  });

  it("says the default moves on, when it is the default", async () => {
    await openMenu({ isDefault: true });

    await userEvent.click(
      screen.getByRole("menuitem", { name: "Delete list" }),
    );

    expect(
      screen.getByText(/your next list becomes the default/i),
    ).toBeVisible();
  });

  it("does nothing if you change your mind", async () => {
    run.mockClear();
    await openMenu();

    await userEvent.click(
      screen.getByRole("menuitem", { name: "Delete list" }),
    );
    await userEvent.click(screen.getByRole("button", { name: /keep it/i }));

    expect(run).not.toHaveBeenCalled();
  });

  it("deletes once it is confirmed", async () => {
    run.mockClear();
    await openMenu();

    await userEvent.click(
      screen.getByRole("menuitem", { name: "Delete list" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Delete list" }));

    expect(run).toHaveBeenCalledWith(expect.anything(), { listId: "list" });
  });
});
