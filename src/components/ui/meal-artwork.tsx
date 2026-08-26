import { cn } from "@heroui/react";

const ARTWORKS = ["tomato", "citrus", "herb"] as const;

export type Artwork = (typeof ARTWORKS)[number];

// Placeholder artwork stands in until a recipe has a photograph.
const artworkClasses: Record<Artwork, string> = {
  citrus:
    "bg-[linear-gradient(150deg,oklch(0.58_0.12_72),oklch(0.82_0.10_88))]",
  herb: "bg-[linear-gradient(150deg,oklch(0.48_0.10_158),oklch(0.74_0.08_152))]",
  tomato:
    "bg-[linear-gradient(150deg,oklch(0.50_0.15_28),oklch(0.74_0.12_44))]",
};

/** Stable per recipe, so a card does not change colour between renders. */
export function artworkFor(id: string): Artwork {
  const sum = [...id].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return ARTWORKS[sum % ARTWORKS.length];
}

export function MealArtwork({
  artwork,
  className,
}: {
  artwork: Artwork;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(artworkClasses[artwork], className)}
    />
  );
}
