import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ImagePicker } from "./image-picker";

function picker(onChange?: () => void) {
  return render(
    <ImagePicker
      accept="image/png"
      currentUrl="https://example.test/portrait.png"
      help="PNG"
      label="Profile photograph"
      name="avatar"
      onChange={onChange}
    />,
  );
}

describe("ImagePicker", () => {
  it("asks the server to remove the photograph", async () => {
    const { container } = picker();
    await userEvent.click(screen.getByRole("button", { name: /remove/i }));

    expect(
      container.querySelector<HTMLInputElement>('input[name="remove-avatar"]')
        ?.value,
    ).toBe("on");
  });

  // Removing is React state, which fires no DOM change event, so a form that enables
  // its save button on being edited never learned the photograph had gone and left
  // the button disabled with nothing to press.
  it("reports the removal to the form around it", async () => {
    const onChange = vi.fn();
    picker(onChange);

    await userEvent.click(screen.getByRole("button", { name: /remove/i }));

    expect(onChange).toHaveBeenCalled();
  });

  it("says nothing to remove until there is a photograph", () => {
    render(
      <ImagePicker
        accept="image/png"
        help="PNG"
        label="Profile photograph"
        name="avatar"
      />,
    );

    expect(screen.queryByRole("button", { name: /remove/i })).toBeNull();
  });
});
