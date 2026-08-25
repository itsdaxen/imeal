import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/ui/legal-page";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What iMeal collects, why it is used, and the choices you have over it.",
};

const sections: ReadonlyArray<LegalSection> = [
  {
    title: "Who is responsible for your data",
    content: (
      <p>
        Farzam Daghighi, operating iMeal, is the data controller. No data
        protection officer has been appointed. For any privacy question or
        request, write to{" "}
        <a href="mailto:hello@thedaxen.com">hello@thedaxen.com</a>.
      </p>
    ),
  },
  {
    title: "What we collect",
    content: (
      <ul>
        <li>
          Account details: your email address, and the display name and
          photograph you choose.
        </li>
        <li>
          What you create in the app: recipes, weekly plans, shopping lists,
          staples, and the photographs you upload.
        </li>
        <li>
          Who you connect to: friend requests you send or accept, and the
          recipes, plans, or lists you deliberately share.
        </li>
        <li>
          Operational records needed to run and protect the service, including
          authentication events and error diagnostics.
        </li>
      </ul>
    ),
  },
  {
    title: "Why we process it",
    content: (
      <ul>
        <li>
          <strong>Contract:</strong> creating your account, storing your recipes
          and plans, generating shopping lists, and sharing what you have chosen
          to share.
        </li>
        <li>
          <strong>Legitimate interests:</strong> keeping accounts secure,
          preventing abuse, and diagnosing failures. We weigh these against your
          rights each time.
        </li>
        <li>
          <strong>Consent:</strong> anything optional is asked for at the time
          and can be withdrawn without affecting earlier lawful processing.
        </li>
      </ul>
    ),
  },
  {
    title: "What other people can see",
    content: (
      <>
        <p>
          Nothing you create is visible to another person unless you share it.
          Sharing is always an action you take: sending a friend request,
          sharing a recipe or a week, or adding someone to a shopping list.
        </p>
        <p>
          A recipe you publish to the public catalog is a copy, and that copy
          belongs to the catalog rather than to your library. Your email address
          is never shown to other users.
        </p>
      </>
    ),
  },
  {
    title: "Assisted features",
    content: (
      <p>
        iMeal can read a recipe you paste and can propose a tidied shopping
        list. These features work on the text you give them at the moment you
        ask, and their results are shown to you for confirmation before anything
        is saved. Where a third-party model is used for this, the text you
        submitted is sent to that provider to produce the result; it is not used
        to train anyone&rsquo;s model.
      </p>
    ),
  },
  {
    title: "Processors and where data is held",
    content: (
      <p>
        Supabase provides the database, authentication, and file storage behind
        iMeal, and Vercel serves the application. Both act as processors under
        contract. Where data leaves the European Economic Area, it is covered by
        the European Commission&rsquo;s standard contractual clauses.
      </p>
    ),
  },
  {
    title: "How long we keep it",
    content: (
      <p>
        Your content is kept while your account exists. Deleting your account
        removes your profile, recipes, plans, lists, and uploaded photographs.
        Copies you published to the public catalog remain, because they no
        longer belong to your library. Records we must keep for legal reasons
        are retained for as long as the law requires.
      </p>
    ),
  },
  {
    title: "Your rights",
    content: (
      <p>
        You may request access to your data, correction, erasure, restriction,
        portability, or object to processing based on legitimate interests.
        Write to <a href="mailto:hello@thedaxen.com">hello@thedaxen.com</a> and
        we will respond within one month. You may also complain to your national
        data protection authority.
      </p>
    ),
  },
  {
    title: "Cookies and device storage",
    content: (
      <p>
        iMeal stores a session cookie so you stay signed in. It is necessary for
        the service to function and is not used for advertising. There is no
        third-party advertising or cross-site tracking in iMeal.
      </p>
    ),
  },
  {
    title: "Security, children, and changes",
    content: (
      <p>
        Access to your data is enforced in the database itself, so a request
        that is not yours returns nothing rather than relying on the interface
        to hide it. iMeal is not directed at children under 16. If this policy
        changes materially, the effective date above changes with it and you
        will be told in the app.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      effective="25 August 2026"
      intro="This policy explains what iMeal collects, why it is used, and the choices you have over it."
      sections={sections}
      title="Privacy Policy"
    />
  );
}
