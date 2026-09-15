"use client";

import { ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { BookOpen, Library } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

/**
 * Which shelf the chooser is looking at.
 *
 * Unlike the day of the week, this changes what has to be fetched, so it is a real
 * navigation rather than a shallow one — the address carries it so that a link to
 * this page opens on the same shelf it was shared from.
 */
export function RecipeSourcePicker({ source }: { source: "mine" | "catalog" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  return (
    <ToggleButtonGroup
      aria-busy={isPending}
      aria-label="Where to choose a recipe from"
      data-flat
      disallowEmptySelection
      onSelectionChange={(keys) => {
        const chosen = [...keys][0] === "catalog" ? "catalog" : "mine";
        const params = new URLSearchParams(searchParams.toString());
        params.set("source", chosen);

        startTransition(() => router.replace(`?${params}`, { scroll: false }));
      }}
      selectedKeys={new Set([source])}
      selectionMode="single"
      size="sm"
    >
      <ToggleButton className="min-h-9 gap-2 px-3" id="mine">
        <BookOpen aria-hidden="true" className="size-4" />
        My recipes
      </ToggleButton>
      <ToggleButton className="min-h-9 gap-2 px-3" id="catalog">
        <Library aria-hidden="true" className="size-4" />
        The catalog
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
