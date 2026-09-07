import { describe, expect, it, vi } from "vitest";

import { closing } from "./app-dialog";

describe("closing", () => {
  it("passes the form data straight through to the action", () => {
    const action = vi.fn();
    const data = new FormData();

    closing(action, () => {})(data);

    expect(action).toHaveBeenCalledWith(data);
  });

  it("closes without waiting for the action to finish", () => {
    const close = vi.fn();
    let settle = () => {};

    closing(
      () => new Promise<void>((resolve) => (settle = resolve)),
      close,
    )(new FormData());

    // A dialog that waits for the round trip before dismissing looks unresponsive.
    expect(close).toHaveBeenCalledOnce();
    settle();
  });

  it("hands the pending promise back, so a failed write is not swallowed", async () => {
    const failure = Promise.reject(new Error("nope"));
    const returned = closing(
      () => failure,
      () => {},
    )(new FormData());

    await expect(returned).rejects.toThrow("nope");
  });

  it("closes even when the action redirects instead of returning", () => {
    const close = vi.fn();
    // `redirect()` inside a server action does not return normally.
    const redirecting = () => new Promise<void>(() => {});

    closing(redirecting, close)(new FormData());

    expect(close).toHaveBeenCalledOnce();
  });
});
