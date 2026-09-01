import type { ReactNode } from "react";

import { Typography } from "@heroui/react";

import { SectionTitle } from "@/components/ui/section-title";
import { Eyebrow } from "@/components/ui/eyebrow";

export type LegalSection = {
  content: ReactNode;
  title: string;
};

export function LegalPage({
  effective,
  intro,
  sections,
  title,
}: {
  effective: string;
  intro: string;
  sections: ReadonlyArray<LegalSection>;
  title: string;
}) {
  return (
    <article className="pb-8">
      <Eyebrow>Legal</Eyebrow>
      <Typography className="mt-3" type="h1" weight="semibold">
        {title}
      </Typography>
      <Typography className="mt-3" color="muted" type="body-sm">
        Effective {effective}
      </Typography>
      <Typography
        className="mt-6 text-base leading-7"
        color="muted"
        type="body"
      >
        {intro}
      </Typography>

      <div className="mt-10 flex flex-col gap-8">
        {sections.map((section) => (
          <section
            className="border-t border-separator pt-6"
            key={section.title}
          >
            <SectionTitle>{section.title}</SectionTitle>
            <div className="mt-3 flex flex-col gap-4 text-base leading-7 text-muted [&_a]:font-medium [&_a]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground">
              {section.content}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
