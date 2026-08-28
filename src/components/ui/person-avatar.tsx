import { Avatar } from "@heroui/react";

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toLocaleUpperCase())
      .join("") || "?"
  );
}

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
        {initials(name)}
      </Avatar.Fallback>
    </Avatar>
  );
}
