import type { Metadata } from "next";
import { DraftNotice } from "@/components/marketing/draft-notice";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="container-page py-16 sm:py-20">
      <h1 className="text-4xl font-semibold sm:text-5xl">Terms of use</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-soft">The short version: use Questlight to learn, be fair to other players, and tell us when something looks wrong.</p>
      <DraftNotice />

      <div className="prose-page mt-4">
        <h2>Early access</h2>
        <p>
          Questlight is an early-stage product. Features may change, and some are still being built. We&apos;ll try
          hard not to lose your progress, but please don&apos;t rely on Questlight as your only copy of anything
          important.
        </p>

        <h2>Your account</h2>
        <ul>
          <li>You must be 13 or older to create an account.</li>
          <li>Keep your password to yourself, and don&apos;t use someone else&apos;s account.</li>
          <li>
            Choose a display name that isn&apos;t offensive and doesn&apos;t include your full real name. We may change
            names that break this rule.
          </li>
        </ul>

        <h2>Playing fairly</h2>
        <p>
          Don&apos;t try to cheat in games, change scores, or get at other people&apos;s data. Scores are checked on the
          server, and accounts that try to get around this may be suspended.
        </p>

        <h2>Learning content</h2>
        <p>
          Questions in the question bank are written for Questlight. We label content as matching an exam board only
          after checking it against that specification, and nothing here is an official exam paper.
        </p>
        <p>
          AI-generated content is always labelled. It can contain mistakes, so check anything important with your
          teacher or textbook, and use the report button if something looks wrong.
        </p>

        <h2>Your flashcards</h2>
        <p>
          Flashcards you write are yours. Please don&apos;t paste in large amounts of copyrighted material, such as whole
          pages of a textbook.
        </p>
      </div>
    </div>
  );
}
