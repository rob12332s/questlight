import type { Metadata } from "next";
import { BookOpen, Layers, ListChecks } from "lucide-react";
import { redirect } from "next/navigation";
import { AiStudio, type Usage } from "@/features/ai/ai-studio";
import { isAiConfigured } from "@/lib/env";
import { getServerSupabase } from "@/lib/supabase/server";
import { getCurriculum } from "@/server/learning";
import { getCurrentStudent } from "@/server/session";

export const metadata: Metadata = { title: "AI study" };

export default async function AiStudyPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const student = await getCurrentStudent();
  if (!student) redirect("/login?next=/ai-study");
  const enabled = isAiConfigured(process.env);

  if (!enabled) {
    return (
      <div className="room-glow">
        <h1 className="text-3xl font-semibold sm:text-4xl">AI study</h1>
        <p className="mt-2 max-w-xl text-ink-soft">
          AI study help is built, but it isn&apos;t switched on for this site yet. It needs the site owner to connect an AI service.
        </p>
        <ul className="mt-10 grid gap-3 sm:grid-cols-3">
          {[
            { icon: BookOpen, title: "Explain", text: "Ask about anything in a topic and get it explained simply, at GCSE level, or in depth." },
            { icon: ListChecks, title: "Practice questions", text: "Fresh multiple-choice questions with explanations, just for practice." },
            { icon: Layers, title: "Flashcards", text: "A deck of key facts for any topic, saved with your other decks." },
          ].map((f) => (
            <li key={f.title} className="rounded-xl border border-line bg-deep p-5">
              <f.icon className="h-5 w-5 text-beam-bright" aria-hidden />
              <h2 className="mt-3 font-semibold">{f.title}</h2>
              <p className="mt-1 text-sm text-ink-soft">{f.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-ink-muted">Until then, everything else works as normal: quizzes, flashcards, live games and classes.</p>
      </div>
    );
  }

  const supabase = await getServerSupabase();
  const [{ topic }, curriculum, { data: usage }, { data: mine }] = await Promise.all([
    searchParams,
    getCurriculum(),
    supabase.rpc("ai_usage"),
    supabase.from("profile_subjects").select("subject_id").eq("profile_id", student.userId),
  ]);
  const mySubjects = new Set(((mine ?? []) as Array<{ subject_id: string }>).map((r) => r.subject_id));
  const subjects = curriculum
    .filter((s) => s.topics.length > 0)
    .sort((a, b) => Number(mySubjects.has(b.id)) - Number(mySubjects.has(a.id)))
    .map((s) => ({ id: s.id, name: s.name, topics: s.topics.map((t) => ({ id: t.id, name: t.name })) }));
  const allTopics = subjects.flatMap((s) => s.topics);
  const initialTopicId = allTopics.find((t) => t.id === topic)?.id ?? allTopics[0]?.id ?? "";

  return (
    <div className="room-glow">
      <h1 className="text-3xl font-semibold sm:text-4xl">AI study</h1>
      <p className="mt-2 max-w-xl text-ink-soft">
        Get a topic explained your way, make extra practice questions, or turn a topic into flashcards.
      </p>
      <div className="mt-10">
        <AiStudio subjects={subjects} usage={(usage as Usage | null) ?? null} initialTopicId={initialTopicId} />
      </div>
    </div>
  );
}
