import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { applyTidy, proposeTidy } from "@/features/ai/ai.actions";
import {
  addManualItem,
  addStaplesToList,
  clearShoppingList,
  generateShoppingList,
  setWeekList,
} from "./shopping.actions";
import { getShoppingList } from "./shopping.queries";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

const defaultList = "00000000-0000-4000-8000-000000000001";
const partyList = "00000000-0000-4000-8000-000000000002";
const userId = "00000000-0000-4000-8000-000000000003";
const weekStart = "2026-08-24";
type Result = { data: unknown; error: { message: string } | null };

function query(data: unknown, error: string | null = null) {
  const result: Result = { data, error: error ? { message: error } : null };
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    single: vi.fn().mockResolvedValue(result),
    then: (resolve: (value: Result) => unknown) =>
      Promise.resolve(result).then(resolve),
  };
}

const from = vi.fn();
const rpc = vi.fn();
const getUser = vi.fn();

function form(values: Record<string, string>) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

beforeEach(() => {
  vi.resetAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: userId } } });
  rpc.mockResolvedValue({ data: null, error: null });
  vi.mocked(createSupabaseServerClient).mockResolvedValue({
    auth: { getUser },
    from,
    rpc,
  } as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>);
});

describe("independent shopping", () => {
  it("reads an explicit list without a plan and never updates the destination", async () => {
    const plan = query(null);
    const fallback = query({ id: defaultList });
    const list = query({ name: "Party" });
    const items = query([{ id: "item", name: "Limes", checked: false }]);
    from
      .mockReturnValueOnce(plan)
      .mockReturnValueOnce(fallback)
      .mockReturnValueOnce(list)
      .mockReturnValueOnce(items);

    expect(await getShoppingList(weekStart, partyList)).toMatchObject({
      listId: partyList,
      targetListId: defaultList,
      planId: null,
      listName: "Party",
      remaining: 1,
    });
    expect(items.eq).toHaveBeenCalledWith("list_id", partyList);
    expect(plan.update).not.toHaveBeenCalled();
  });

  it("keeps week links working when no explicit list was selected", async () => {
    from
      .mockReturnValueOnce(query({ id: "plan", target_list_id: partyList }))
      .mockReturnValueOnce(query({ name: "Party" }))
      .mockReturnValueOnce(query([]));
    expect(await getShoppingList(weekStart)).toMatchObject({
      listId: partyList,
      targetListId: partyList,
    });
  });

  it("does not substitute the default for a deleted or inaccessible explicit list", async () => {
    from
      .mockReturnValueOnce(query({ id: "plan", target_list_id: defaultList }))
      .mockReturnValueOnce(query(null))
      .mockReturnValueOnce(query([]));
    expect(await getShoppingList(weekStart, partyList)).toMatchObject({
      listId: null,
      items: [],
    });
  });

  it("does not treat a failed plan query as an empty week", async () => {
    from.mockReturnValueOnce(query(null, "unavailable"));
    await expect(getShoppingList(weekStart, partyList)).rejects.toThrow(
      "Could not load the week's",
    );
  });

  it("adds a manual item to the displayed list without a week or plan", async () => {
    const items = query(null);
    from.mockReturnValue(items);
    await addManualItem(
      form({ listId: partyList, name: "Limes", quantity: "3" }),
    );
    expect(items.insert).toHaveBeenCalledWith({
      user_id: userId,
      list_id: partyList,
      name: "Limes",
      quantity: 3,
      source: "manual",
    });
    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith("shopping_items");
  });

  it("rejects a malformed list ID before a write", async () => {
    await addManualItem(form({ listId: "bad", name: "Limes" }));
    expect(from).not.toHaveBeenCalled();
  });

  it("reports an insertion refused by RLS", async () => {
    from.mockReturnValue(query(null, "row-level security"));
    await expect(
      addManualItem(form({ listId: partyList, name: "Limes" })),
    ).rejects.toThrow("Could not add the item");
  });

  it("adds only missing staples to the displayed list without a plan", async () => {
    const staples = query([{ name: "Salt" }, { name: "Milk" }]);
    const existing = query([{ name: "salt" }]);
    const insert = query(null);
    from
      .mockReturnValueOnce(staples)
      .mockReturnValueOnce(existing)
      .mockReturnValueOnce(insert);
    await addStaplesToList(form({ listId: partyList }));
    expect(existing.eq).toHaveBeenCalledWith("list_id", partyList);
    expect(insert.insert).toHaveBeenCalledWith([
      { user_id: userId, list_id: partyList, name: "Milk", source: "staple" },
    ]);
    expect(from).not.toHaveBeenCalledWith("meal_plans");
  });

  it("clears the displayed list rather than the week's destination", async () => {
    const items = query(null);
    from.mockReturnValue(items);
    await clearShoppingList(form({ listId: partyList, weekStart }));
    expect(items.delete).toHaveBeenCalled();
    expect(items.eq).toHaveBeenCalledWith("list_id", partyList);
    expect(from).not.toHaveBeenCalledWith("meal_plans");
  });

  it("previews and applies tidy to the same explicit list", async () => {
    const items = query([
      { id: userId, name: "milk", quantity: 1, checked: false, category: null },
    ]);
    from.mockReturnValue(items);
    expect(await proposeTidy({}, form({ listId: partyList }))).toHaveProperty(
      "changes",
    );
    await applyTidy(form({ listId: partyList }));
    expect(items.eq).toHaveBeenCalledWith("list_id", partyList);
    expect(rpc).toHaveBeenCalledWith(
      "apply_shopping_tidy",
      expect.objectContaining({ p_list: partyList }),
    );
    expect(from).not.toHaveBeenCalledWith("meal_plans");
  });

  it("refuses generation when the saved destination differs from the form", async () => {
    from.mockReturnValueOnce(
      query({ id: "plan", target_list_id: defaultList }),
    );
    await expect(
      generateShoppingList(form({ listId: partyList, weekStart })),
    ).rejects.toThrow("destination changed");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("refuses an inaccessible generation destination before updating the plan", async () => {
    from.mockReturnValueOnce(query(null));
    await expect(
      setWeekList(form({ listId: partyList, weekStart })),
    ).rejects.toThrow("no longer available");
    expect(from).not.toHaveBeenCalledWith("meal_plans");
  });
});
