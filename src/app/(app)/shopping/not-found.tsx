import { ListX } from "lucide-react";

import { ActionLink } from "@/components/ui/action";
import { BackAction } from "@/components/ui/back-action";
import { EmptyState } from "@/components/ui/empty-state";

export default function ShoppingNotFound() {
  return (
    <main className="flex min-h-[65vh] items-center py-10 sm:py-14">
      <EmptyState
        actions={
          <>
            <ActionLink href="/shopping" tier="primary">
              Open my shopping list
            </ActionLink>
            <BackAction />
          </>
        }
        description="It may have been deleted or is no longer shared with you."
        icon={<ListX className="size-6" />}
        title="This list is unavailable"
      />
    </main>
  );
}
