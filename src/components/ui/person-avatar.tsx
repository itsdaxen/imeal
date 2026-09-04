import { Avatar } from "@heroui/react";

import { initialsOf } from "@/lib/text";

/** A consistent identity cue for people even when no profile photo exists. */
export function PersonAvatar({
  name,
  src,
}: {
  name: string;
  src?: string | null;
}) {
  return (
    <Avatar className="size-11 shrink-0" variant="soft">
      {src ? <Avatar.Image alt="" src={src} /> : null}
      <Avatar.Fallback className="bg-identity font-semibold text-identity-foreground">
        {initialsOf(name)}
      </Avatar.Fallback>
    </Avatar>
  );
}
