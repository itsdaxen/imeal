import { Button } from "@heroui/react";

import { signOut } from "../auth.actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button size="sm" type="submit" variant="ghost">
        Sign out
      </Button>
    </form>
  );
}
