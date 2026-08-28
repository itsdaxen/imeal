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
    (total, character) => (total * 31 + character.charCodeAt(0)) >>> 0,
    7,
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
      className={cn(
        "relative isolate overflow-hidden",
        artworkClasses[artwork],
        className,
      )}
    >
      <span className="absolute -top-8 -right-8 size-28 rounded-full bg-white/15" />
      <span className="absolute -bottom-10 -left-7 size-32 rounded-full bg-black/10" />
      <span className="absolute inset-0 grid place-items-center">
        {artwork === "tomato" ? (
          <span className="relative size-16 rounded-full bg-white/75 shadow-lg before:absolute before:-top-2 before:left-1/2 before:size-5 before:-translate-x-1/2 before:rotate-45 before:rounded-tl-full before:bg-green-700/70" />
        ) : artwork === "citrus" ? (
          <span className="grid size-20 place-items-center rounded-full border-4 border-white/65 bg-yellow-200/55 shadow-lg before:size-1 before:rounded-full before:bg-white/80" />
        ) : (
          <span className="h-20 w-14 rotate-12 rounded-[70%_20%_70%_20%] bg-white/55 shadow-lg ring-1 ring-white/40" />
        )}
      </span>
    </div>
  );
}
