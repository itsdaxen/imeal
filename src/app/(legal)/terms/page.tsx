import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/ui/legal-page";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms you agree to when you use iMeal.",
};

const sections: ReadonlyArray<LegalSection> = [
  {
    title: "Agreement and provider",
    content: (
      <p>
        iMeal is provided by Farzam Daghighi. By creating an account you agree
        to these terms. If you do not agree with them, do not use the service.
      </p>
    ),
  },
  {
    title: "Your account",
    content: (
      <p>
        You need an account to use iMeal, you must give an address you control,
        and you are responsible for what happens under your account. Tell us
        promptly if you believe someone else has access to it.
      </p>
    ),
  },
  {
    title: "What you create",
    content: (
      <p>
        Your recipes, plans, lists, and photographs remain yours. You grant us
        only the permission needed to store and display them to you and to the
        people you have shared them with. Publishing a recipe to the public
        catalog is different: it creates a copy that other people may use, and
        that copy is no longer under your control.
      </p>
    ),
  },
  {
    title: "Acceptable use",
    content: (
      <ul>
        <li>
          Do not upload content you have no right to publish, or anything
          unlawful, abusive, or deliberately misleading.
        </li>
        <li>
          Do not attempt to reach data that is not yours, disrupt the service,
          or work around its limits.
        </li>
        <li>
          Do not use another person&rsquo;s account, or share yours with someone
          who has not agreed to these terms.
        </li>
      </ul>
    ),
  },
  {
    title: "Assisted features and their limits",
    content: (
      <p>
        iMeal can read a pasted recipe and can propose a tidied shopping list.
        Both produce suggestions, not facts. They are shown to you for
        confirmation before anything is saved, and you are responsible for
        checking the result — particularly anything that affects allergies,
        dietary requirements, or food safety.
      </p>
    ),
  },
  {
    title: "Nutrition and food safety",
    content: (
      <p>
        iMeal helps you plan meals. It does not give medical, nutritional, or
        food-safety advice, and nothing in it should be relied on as such.
        Cooking times, temperatures, and ingredients are yours to verify.
      </p>
    ),
  },
  {
    title: "Availability and changes",
    content: (
      <p>
        The service is offered as it is. Features may change, and there may be
        interruptions for maintenance or for reasons outside our control. Where
        a change materially reduces what the service does, we will say so in the
        app.
      </p>
    ),
  },
  {
    title: "Suspension and ending your account",
    content: (
      <p>
        You may delete your account at any time from your profile. We may
        suspend or close an account that breaks these terms or puts other users
        or the service at risk, and will explain why unless the law prevents it.
      </p>
    ),
  },
  {
    title: "Liability",
    content: (
      <p>
        Nothing here limits liability that cannot be limited by law, including
        for death, personal injury, or fraud. Beyond that, iMeal is not liable
        for indirect or consequential loss, or for loss of data you have not
        kept a copy of elsewhere. Your statutory rights as a consumer are
        unaffected.
      </p>
    ),
  },
  {
    title: "Applicable law",
    content: (
      <p>
        These terms are governed by Finnish law. If you are a consumer, you keep
        the protection of the mandatory rules of the country where you live, and
        may bring proceedings in your local courts.
      </p>
    ),
  },
  {
    title: "Changes to these terms",
    content: (
      <p>
        If these terms change materially, the effective date above changes with
        them and you will be told in the app before the change takes effect.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      effective="25 August 2026"
      intro="These terms cover what you can expect from iMeal and what iMeal expects from you."
      sections={sections}
      title="Terms of Service"
    />
  );
}
