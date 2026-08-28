"use client";

import { ArrowLeft } from "lucide-react";

import { ActionButton } from "./action";

export function BackAction() {
  return (
    <ActionButton onPress={() => history.back()} tier="neutral">
      <ArrowLeft aria-hidden="true" className="size-4" />
      Go back
    </ActionButton>
  );
}
