"use client";

import { Button, Link, Typography } from "@heroui/react";
import { PageShell } from "@/components/ui/page-shell";

export default function ShoppingError({ retry }: { retry: () => void }) {
  return (
    <PageShell gap="compact" width="narrow">
      <Typography type="h1">Shopping could not be updated</Typography>
      <Typography type="body">
        Reload the list to check its latest items before trying your change
        again. If someone removed your access, open another list.
      </Typography>
      <div className="flex flex-wrap items-center gap-4">
        <Button onPress={retry}>Reload list</Button>
        <Link href="/shopping">Open my shopping list</Link>
      </div>
    </PageShell>
  );
}
