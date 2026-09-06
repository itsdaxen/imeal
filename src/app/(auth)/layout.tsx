import type { ReactNode } from "react";

import { Link } from "@heroui/react";
import { Check } from "lucide-react";
import Image from "next/image";

import authKitchen from "../../../public/auth-kitchen.webp";
import { LegalLinks } from "@/components/ui/legal-links";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen md:grid-cols-[minmax(0,1fr)_minmax(22rem,1.05fr)] lg:grid-cols-[minmax(0,1fr)_minmax(32rem,0.82fr)]">
      <section className="flex min-h-[100svh] flex-col px-5 py-6 sm:px-10 md:order-2 md:px-10 md:py-8 lg:px-14 lg:py-10 xl:px-20">
        <header className="flex items-center justify-between gap-6">
          <Link
            aria-label="iMeal home"
            className="font-brand text-3xl leading-normal text-foreground no-underline"
            href="/"
          >
            iMeal
          </Link>
          <span className="hidden text-sm text-muted sm:inline">
            Plan once. Eat well all week.
          </span>
        </header>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12 sm:py-16">
          {children}
        </div>

        <footer className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
          <span>© {new Date().getFullYear()} iMeal</span>
          <LegalLinks />
        </footer>
      </section>

      <aside className="relative hidden min-h-screen overflow-hidden bg-foreground md:block">
        <Image
          alt="A colorful grain bowl and vegetables ready for the week"
          className="object-cover"
          fill
          loading="eager"
          placeholder="blur"
          sizes="(min-width: 768px) 50vw, 0px"
          src={authKitchen}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 p-8 text-white lg:p-10 xl:p-14">
          <p className="mb-4 text-xs font-semibold tracking-[0.15em] text-white/75 uppercase">
            Your week, brought together
          </p>
          <h2 className="max-w-xl text-3xl leading-tight font-semibold text-balance lg:text-4xl xl:text-5xl">
            From recipes you trust to one useful shopping list.
          </h2>
          <ul className="mt-8 hidden gap-3 text-sm text-white/90 lg:grid xl:grid-cols-2">
            {[
              "Plan every meal",
              "Cook step by step",
              "Share with friends",
              "Shop without duplicates",
            ].map((benefit) => (
              <li className="flex items-center gap-2" key={benefit}>
                <span className="grid size-5 place-items-center rounded-full bg-white/15">
                  <Check aria-hidden="true" className="size-3.5" />
                </span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </main>
  );
}
