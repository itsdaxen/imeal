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

vi.mock("@/lib/use-server-action", () => ({
  useServerAction: () => ({ isPending: false, run: vi.fn() }),
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

  // Everything falls back to the default list and the server refuses to delete it,
  // so offering the option only ever produced an error.
  it("does not offer to delete the default list", async () => {
    await openMenu({ isDefault: true });

    expect(screen.queryByRole("menuitem", { name: "Delete list" })).toBeNull();
  });

  it("still lets the default list be renamed", async () => {
    await openMenu({ isDefault: true });

    expect(screen.getByRole("menuitem", { name: "Rename list" })).toBeVisible();
  });

  it("offers neither on a list somebody else owns", async () => {
    await openMenu({ isOwn: false });

    expect(screen.queryByRole("menuitem", { name: "Delete list" })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: "Rename list" })).toBeNull();
  });
});
