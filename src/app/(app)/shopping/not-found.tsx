import { Link, Typography } from "@heroui/react";

export default function ShoppingNotFound() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 pt-10 sm:pt-14">
      <Typography type="h1">This list is unavailable</Typography>
      <Typography type="body">
        It may have been deleted or is no longer shared with you.
      </Typography>
      <Link href="/shopping">Open my shopping list</Link>
    </main>
  );
}
