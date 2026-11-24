import type { Metadata } from "next";
import { Crown, Lock } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buttonClasses } from "@/components/ui/button";
import { formatProPrice } from "@/config/plans";
import { validateLesson, type Lesson } from "@/domain/lesson";
import { Coach } from "@/features/coach/coach";
import { isCoachMode, toLessonView } from "@/features/coach/lesson-view";
import { LearningContext, ProBadge } from "@/features/library/labels";
import { LimitPrompt, UpgradeButton } from "@/features/pro/upgrade";
import { isAiConfigured } from "@/lib/env";
import { getServerSupabase } from "@/lib/supabase/server";
import { getCourses, getPlan, getSubjects, getTopicById } from "@/server/library";
import { getCurrentStudent } from "@/server/session";

export const metadata: Metadata = { title: "Exam Answer Coach" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CoachPage({
  params,
  searchParams,
}: {
  params: Promise<{ topicId: string }>;
  searchParams: Promise<{ mode?: string; retest?: string }>;
}) {
  const [{ topicId }, { mode: rawMode, retest }] = await Promise.all([params, searchParams]);
  const student = await getCurrentStudent();
  if (!student) redirect(`/login?next=/coach/${topicId}`);
  if (!UUID.test(topicId)) notFound();

  const [topic, subjects, courses] = await Promise.all([getTopicById(topicId), getSubjects(), getCourses(student.userId)]);
  if (!topic) notFound();
  const subject = subjects.find((s) => s.id === topic.subjectId);
  if (!subject) notFound();
  const course = courses.get(subject.id);
  const mode = isCoachMode(rawMode) ? rawMode : "teach";
  const topicHref = `/library/${subject.slug}/${topic.slug}`;

  const header = (
    <header className="mb-8">
      <Link href={topicHref} className="text-sm text-ink-soft hover:text-ink">
        ← {topic.title}
      </Link>
      <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{topic.title}</h1>
      <div className="mt-3">
        <LearningContext subject={subject.name} board={course?.board ?? null} tier={course?.tier ?? null} topic={topic.area} />
      </div>
    </header>
  );

  const supabase = await getServerSupabase();
  const { data, error } = await supabase.rpc("open_lesson", { p_topic: topicId });

  if (error) {
    const plan = await getPlan();
    if (error.hint === "pro_required") {
      return (
        <div>
          {header}
          <section className="rounded-2xl border border-pro/30 bg-pro-wash p-6 sm:p-8">
            <ProBadge locked />
            <h2 className="mt-4 text-2xl font-semibold">This lesson is part of Pro</h2>
            <p className="mt-2 max-w-prose text-ink-soft">
              Pro opens every topic in the library and the complete Exam Answer Coach for {formatProPrice()}. Free students get a starter
              topic in every subtopic.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <UpgradeButton reason={`“${topic.title}” is a Pro lesson.`} className={buttonClasses("primary", "md")}>
                <Crown className="h-4 w-4" aria-hidden /> See Pro
              </UpgradeButton>
              <Link href={`/library/${subject.slug}`} className={buttonClasses("ghost", "md")}>
                Browse free topics
              </Link>
            </div>
          </section>
        </div>
      );
    }
    if (error.hint === "daily_limit") {
      const reason = `You've opened ${plan.freeLessonsPerDay} lessons today — the free plan's daily limit. Pro has no daily limit.`;
      return (
        <div>
          {header}
          <LimitPrompt reason={reason} />
          <section className="rounded-2xl border border-line bg-deep p-6 sm:p-8">
            <Lock className="h-6 w-6 text-ink-soft" aria-hidden />
            <h2 className="mt-4 text-2xl font-semibold">That&apos;s today&apos;s free lessons</h2>
            <p className="mt-2 max-w-prose text-ink-soft">
              You can open {plan.freeLessonsPerDay} different lessons a day on the free plan, and you can go back to any of today&apos;s lessons
              as often as you like. New lessons open again tomorrow. Quizzes and flashcards aren&apos;t limited.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/quizzes" className={buttonClasses("secondary", "md")}>
                Do a quiz instead
              </Link>
              <UpgradeButton reason={reason} className={buttonClasses("ghost", "md")}>
                What does Pro include?
              </UpgradeButton>
            </div>
          </section>
        </div>
      );
    }
    return (
      <div>
        {header}
        <section className="rounded-2xl border border-line bg-deep p-6 sm:p-8">
          <h2 className="text-2xl font-semibold">The coach lesson for this topic is being written</h2>
          <p className="mt-2 max-w-prose text-ink-soft">
            It isn&apos;t ready yet, so it isn&apos;t shown.{" "}
            {topic.quizTopicId ? "You can practise this area with a quiz in the meantime." : "Try one of the topics marked “Full lesson”."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {topic.quizTopicId && (
              <Link href={`/quizzes?topic=${topic.quizTopicId}`} className={buttonClasses("primary", "md")}>
                Practise with a quiz
              </Link>
            )}
            <Link href={`/library/${subject.slug}`} className={buttonClasses("ghost", "md")}>
              Back to {subject.name}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const content = (data as { content?: unknown } | null)?.content;
  if (validateLesson(content).length > 0) notFound();
  const lesson = toLessonView(content as Lesson);

  const { data: history } = await supabase
    .from("coach_attempts")
    .select("mode, marks_awarded, marks_available, mistakes, created_at")
    .eq("player_id", student.userId)
    .eq("topic_id", topicId)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div>
      {header}
      <Coach
        topicId={topicId}
        basePath={`/coach/${topicId}`}
        mode={mode}
        lesson={lesson}
        aiEnabled={isAiConfigured(process.env)}
        testMode={retest === "1" ? "retest" : "independent"}
        history={((history ?? []) as Array<{ mode: string; marks_awarded: number; marks_available: number; mistakes: string[]; created_at: string }>).map((h) => ({
          mode: h.mode,
          awarded: h.marks_awarded,
          available: h.marks_available,
          mistakes: h.mistakes ?? [],
          at: h.created_at,
        }))}
      />
    </div>
  );
}
