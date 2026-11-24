import type { Metadata } from "next";
import { DraftNotice } from "@/components/marketing/draft-notice";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="container-page py-16 sm:py-20">
      <h1 className="text-4xl font-semibold sm:text-5xl">Privacy</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-soft">
        Questlight is used by young people, so we collect as little as we can and keep it out of sight of other users.
      </p>
      <DraftNotice />

      <div className="prose-page mt-4">
        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Your email address and password</strong>, so you can log in. Your password is stored by our
            authentication provider in a form we can&apos;t read. Other users never see your email.
          </li>
          <li>
            <strong>A display name</strong> that you choose. It doesn&apos;t need to be your real name, and it&apos;s
            what other players see.
          </li>
          <li>
            <strong>Your education stage and subjects</strong>, so we show you the right content.
          </li>
          <li>
            <strong>Your learning activity</strong>: answers, scores, flashcard ratings and the games you played. This
            is how Questlight works out your weaker topics.
          </li>
          <li>
            <strong>Reports you send</strong> about questions or flashcards that look wrong.
          </li>
        </ul>

        <h2>What we don&apos;t collect</h2>
        <ul>
          <li>Your real name, date of birth, school, or where you are.</li>
          <li>Advertising or cross-site tracking data. There are no adverts on Questlight.</li>
          <li>Private messages. There is no chat between students.</li>
        </ul>

        <h2>Who can see what</h2>
        <p>
          Other students can see your display name and score in live games you join. Leaderboards are off for new
          accounts: your name only appears there if you choose to show it, and you can hide it again at any time. If you
          join a teacher&apos;s class, that teacher can see your display name, your XP, quizzes and accuracy for the
          week, when you were last active, and whether you have done work they set (with your best score). Your
          classmates can see your display name and weekly XP on the class leaderboard. You can leave a class at any time.
        </p>

        <h2>Who processes your data</h2>
        <p>
          We use Supabase to store accounts and learning data, and Vercel to host the website. If AI study help is
          switched on, the topic and question you ask about are sent to an AI provider to generate a reply. Your email
          and display name are never included.
        </p>

        <h2>Deleting your account</h2>
        <p>
          Deleting your account removes your profile, your learning history, your flashcards and any reports you made.
          Shared questions you answered stay in the question bank, but they&apos;re no longer linked to you.
        </p>

        <h2>Age</h2>
        <p>
          You need to be 13 or older to create an account. Support for younger students, with a parent or school
          involved, will come later.
        </p>
      </div>
    </div>
  );
}
