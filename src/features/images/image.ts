export const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const RECIPE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export type ImageCheck = { ok: true } | { ok: false; reason: string };

const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

function megabytes(bytes: number) {
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10}MB`;
}

/**
 * The bucket enforces these too. Checking here as well is what turns a rejected
 * upload into a sentence the user can act on.
 */
export function checkImage(
  file: { size: number; type: string },
  maxBytes: number,
): ImageCheck {
  if (file.size === 0) {
    return { ok: false, reason: "That file is empty." };
  }

  if (!IMAGE_TYPES.includes(file.type as (typeof IMAGE_TYPES)[number])) {
    return { ok: false, reason: "Choose a JPEG, PNG, WebP, or AVIF image." };
  }

  if (file.size > maxBytes) {
    return {
      ok: false,
      reason: `That image is ${megabytes(file.size)}. The limit is ${megabytes(maxBytes)}.`,
    };
  }

  return { ok: true };
}

/**
 * Every path begins with the uploader's id, which is what the storage policies
 * scope writes on. The timestamp keeps a replaced image from being served from
 * a cache under its old URL.
 */
export function imagePath(
  userId: string,
  type: string,
  now: number = Date.now(),
) {
  return `${userId}/${now}.${EXTENSION[type] ?? "jpg"}`;
}
