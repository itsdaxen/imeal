import { describe, expect, it } from "vitest";

import {
  AVATAR_MAX_BYTES,
  checkImage,
  imagePath,
  RECIPE_IMAGE_MAX_BYTES,
} from "./image";

describe("checkImage", () => {
  it("accepts an image inside the limit", () => {
    expect(
      checkImage({ size: 1000, type: "image/png" }, AVATAR_MAX_BYTES),
    ).toEqual({
      ok: true,
    });
  });

  it.each(["image/jpeg", "image/png", "image/webp", "image/avif"])(
    "accepts %s",
    (type) => {
      expect(checkImage({ size: 10, type }, AVATAR_MAX_BYTES).ok).toBe(true);
    },
  );

  it("refuses a type that is not an image", () => {
    const result = checkImage(
      { size: 10, type: "application/pdf" },
      AVATAR_MAX_BYTES,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toMatch(/JPEG, PNG, WebP, or AVIF/);
  });

  it("refuses an empty file before anything else", () => {
    const result = checkImage({ size: 0, type: "image/png" }, AVATAR_MAX_BYTES);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("That file is empty.");
  });

  it("says how big the image was and what the limit is", () => {
    const result = checkImage(
      { size: 3 * 1024 * 1024, type: "image/png" },
      AVATAR_MAX_BYTES,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("That image is 3MB. The limit is 2MB.");
  });

  it("allows a recipe photograph larger than an avatar", () => {
    const file = { size: 3 * 1024 * 1024, type: "image/jpeg" };

    expect(checkImage(file, AVATAR_MAX_BYTES).ok).toBe(false);
    expect(checkImage(file, RECIPE_IMAGE_MAX_BYTES).ok).toBe(true);
  });
});

describe("imagePath", () => {
  it("puts the file in a folder named for the uploader", () => {
    expect(imagePath("user-1", "image/png", 42)).toBe("user-1/42.png");
  });

  it("maps each accepted type to its extension", () => {
    expect(imagePath("u", "image/jpeg", 1)).toBe("u/1.jpg");
    expect(imagePath("u", "image/webp", 1)).toBe("u/1.webp");
    expect(imagePath("u", "image/avif", 1)).toBe("u/1.avif");
  });

  it("changes on every upload so a replacement is not served from cache", () => {
    expect(imagePath("u", "image/png", 1)).not.toBe(
      imagePath("u", "image/png", 2),
    );
  });
});
