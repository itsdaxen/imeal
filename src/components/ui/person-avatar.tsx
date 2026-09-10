import { Avatar } from "@heroui/react";

import { initialsOf } from "@/lib/text";

/**
 * The initials are sized alongside the circle rather than by whoever places it.
 *
 * `avatar__fallback` sets a small type size on the initials themselves, which a type
 * utility on the avatar around them cannot reach — so a bigger circle alone leaves a
 * badge-sized letter floating in the middle of it.
 */
const SIZES = {
  default: { circle: "size-11", initials: "" },
  fill: { circle: "size-full", initials: "text-4xl" },
} as const;

/** A consistent identity cue for people even when no profile photo exists. */
export function PersonAvatar({
  name,
  size = "default",
  src,
}: {
  name: string;
  size?: keyof typeof SIZES;
  src?: string | null;
}) {
  const { circle, initials } = SIZES[size];

  return (
    <Avatar className={`${circle} shrink-0`} variant="soft">
      {src ? <Avatar.Image alt="" src={src} /> : null}
      <Avatar.Fallback
        className={`bg-identity font-semibold text-identity-foreground ${initials}`}
      >
        {initialsOf(name)}
      </Avatar.Fallback>
    </Avatar>
  );
}
