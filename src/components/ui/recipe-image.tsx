import Image from "next/image";
import { cn } from "@heroui/react";

import { artworkFor, MealArtwork } from "./meal-artwork";

type Dimensions =
  | { fill: true; height?: never; width?: never }
  | { fill?: false; height: number; width: number };

/**
 * A recipe's photograph, or the artwork that stands in for one.
 *
 * Seven places wrote out the same conditional, each having to remember both the
 * `object-cover` on the photo and the fallback behind it. Forgetting the fallback
 * leaves an empty box rather than an error, which is the kind of mistake that reaches
 * production, so the rule lives in one place and the id is all a caller needs.
 */
export function RecipeImage({
  className,
  fill,
  height,
  id,
  imageUrl,
  preload = false,
  sizes,
  width,
}: Dimensions & {
  /** Applies to the photograph and the artwork alike, so they occupy the same box. */
  className?: string;
  id: string;
  imageUrl: string | null;
  preload?: boolean;
  sizes?: string;
}) {
  if (!imageUrl) {
    return <MealArtwork artwork={artworkFor(id)} className={className} />;
  }

  return (
    <Image
      alt=""
      className={cn("object-cover", className)}
      preload={preload}
      sizes={sizes}
      src={imageUrl}
      {...(fill ? { fill: true } : { height: height!, width: width! })}
    />
  );
}
