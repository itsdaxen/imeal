import type { ReactNode } from "react";

import { Link } from "@heroui/react";

import { AppFooter } from "@/components/ui/app-footer";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
      <header className="py-6">
        <Link
          aria-label="iMeal home"
          className="font-brand text-2xl leading-normal text-foreground no-underline"
          href="/"
        >
          iMeal
        </Link>
      </header>

      <main>{children}</main>

      <AppFooter />
    </div>
  );
}
