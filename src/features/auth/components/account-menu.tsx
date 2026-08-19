"use client";

import { useState } from "react";
import { Avatar, Button, Link, Popover } from "@heroui/react";

import { signOut } from "../auth.actions";

// Every row is the same shape, so the menu reads as one list rather than a link
// and a button that happen to sit together.
const itemClassName =
  "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-foreground no-underline transition-colors hover:bg-default motion-reduce:transition-none";

type AccountMenuProps = {
  avatarUrl?: string | null;
  displayName: string;
  initials: string;
};

export function AccountMenu({
  avatarUrl,
  displayName,
  initials,
}: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
      {/* The trigger is a circle concentric with the avatar, sized to the
          minimum touch target so the hover state reads as intentional. */}
      <Popover.Trigger>
        <Button
          aria-label={`Signed in as ${displayName}. Open the account menu`}
          className="size-11 rounded-full p-0"
          isIconOnly
          variant="ghost"
        >
          <Avatar size="sm" variant="soft">
            {avatarUrl ? <Avatar.Image alt="" src={avatarUrl} /> : null}
            <Avatar.Fallback className="bg-identity text-identity-foreground">
              {initials}
            </Avatar.Fallback>
          </Avatar>
        </Button>
      </Popover.Trigger>

      <Popover.Content className="w-64 p-2" placement="bottom end">
        <Popover.Dialog className="outline-none">
          <Link
            className="flex items-center gap-3 rounded-xl px-3 py-3 no-underline transition-colors hover:bg-default motion-reduce:transition-none"
            href="/profile"
            onPress={() => setIsOpen(false)}
          >
            <Avatar size="md" variant="soft">
              {avatarUrl ? <Avatar.Image alt="" src={avatarUrl} /> : null}
              <Avatar.Fallback className="bg-identity text-identity-foreground">
                {initials}
              </Avatar.Fallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-foreground">
                {displayName}
              </span>
              <span className="block truncate text-sm text-muted">
                View profile
              </span>
            </span>
          </Link>

          <div className="my-2 border-t border-separator" />

          <form action={signOut}>
            <button className={itemClassName} type="submit">
              Sign out
            </button>
          </form>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
