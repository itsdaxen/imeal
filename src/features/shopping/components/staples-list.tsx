"use client";

import { useOptimistic } from "react";

import { Typography } from "@heroui/react";
import { ShoppingBasket } from "lucide-react";

import { ContentCard } from "@/components/ui/content-card";
import { EmptyState } from "@/components/ui/empty-state";
import { span } from "@/components/ui/page-grid";
import { SectionTitle } from "@/components/ui/section-title";
import { type ServerAction, useServerAction } from "@/lib/use-server-action";

import { removeStaple, toggleStaple } from "../shopping.actions";
import { StapleMenu } from "./staple-menu";

export type Staple = { active: boolean; id: string; name: string };

type Change = { id: string; kind: "remove" | "toggle" };

function applyChange(staples: Staple[], change: Change) {
  return change.kind === "remove"
    ? staples.filter((staple) => staple.id !== change.id)
    : staples.map((staple) =>
        staple.id === change.id
          ? { ...staple, active: !staple.active }
          : staple,
      );
}

/**
 * Pausing moves a staple between two lists on this page, so the whole set is held
 * here rather than in each row — a row cannot move itself out of its own list.
 */
export function StaplesList({ staples }: { staples: Staple[] }) {
  const { run: send } = useServerAction();
  const [shown, apply] = useOptimistic(staples, applyChange);

  function run(change: Change, action: ServerAction) {
    send(action, { stapleId: change.id }, () => apply(change));
  }

  const active = shown.filter((staple) => staple.active);
  const paused = shown.filter((staple) => !staple.active);

  function rows(items: Staple[]) {
    return (
      <ul className="flex list-none flex-col p-0">
        {items.map((staple) => (
          <li
            className="flex min-h-14 items-center justify-between gap-3 border-b border-separator last:border-b-0"
            key={staple.id}
          >
            <span className={staple.active ? undefined : "text-muted"}>
              {staple.name}
            </span>
            <StapleMenu
              active={staple.active}
              name={staple.name}
              onRemove={() =>
                run({ id: staple.id, kind: "remove" }, removeStaple)
              }
              onToggle={() =>
                run({ id: staple.id, kind: "toggle" }, toggleStaple)
              }
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <>
      {/* The panel is here whether or not it holds anything, so the page does not
          swap one shape for another the moment you add your first staple. */}
      <ContentCard aria-label="Active staples" className={span.wide}>
        <SectionTitle>Ready to add · {active.length}</SectionTitle>
        {active.length > 0 ? (
          rows(active)
        ) : shown.length > 0 ? (
          <Typography color="muted" type="body-sm">
            Resume a paused staple when you need it again.
          </Typography>
        ) : (
          <EmptyState
            bare
            icon={<ShoppingBasket aria-hidden="true" className="size-6" />}
            title="No staples yet"
          />
        )}
      </ContentCard>

      {/* Sits under the active list rather than beside the composer. */}
      {paused.length > 0 ? (
        <ContentCard
          aria-label="Paused staples"
          className={`${span.wide} lg:col-start-5`}
        >
          <SectionTitle>Paused · {paused.length}</SectionTitle>
          {rows(paused)}
        </ContentCard>
      ) : null}
    </>
  );
}
