import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LessonEditor } from "@/features/admin/admin-forms";
import { getServerSupabase } from "@/lib/supabase/server";
import { getIsContentAdmin, getTopicById } from "@/server/library";
import { getCurrentStudent } from "@/server/session";

export const metadata: Metadata = { title: "Edit lesson" };

const TEMPLATE = {
  style: "explanation",
  summary: "",
  knowledge: ["", ""],
  vocabulary: [],
  recognise: "",
  commandWords: [],
  method: [
    { title: "", detail: "" },
    { title: "", detail: "" },
  ],
  mistakes: [{ tag: "missing_key_term", text: "" }],
  worked: { question: "", marks: 1, steps: [], finalAnswer: "" },
  guided: [],
  exam: [],
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditLessonPage({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await params;
  const student = await getCurrentStudent();
  if (!student) redirect(`/login?next=/admin/content/${topicId}`);
  if (!UUID.test(topicId) || !(await getIsContentAdmin())) notFound();
  const topic = await getTopicById(topicId);
  if (!topic) notFound();
  const supabase = await getServerSupabase();
  const { data } = await supabase.rpc("admin_get_lesson", { p_topic: topicId });
  const lesson = data as { content: unknown; version: number; status: string; review_note: string | null } | null;

  return (
    <div>
      <Link href="/admin/content" className="text-sm text-ink-soft hover:text-ink">
        ← Content admin
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">{topic.title}</h1>
      <p className="mt-1 text-sm text-ink-muted">
        {lesson ? `Version ${lesson.version} · ${lesson.status.replace("_", " ")}` : "No lesson yet — start from the template."} The lesson
        format is checked before saving (see src/domain/lesson.ts).
      </p>
      <div className="mt-6">
        <LessonEditor topicId={topicId} content={JSON.stringify(lesson?.content ?? TEMPLATE, null, 2)} status={lesson?.status ?? "draft"} note={lesson?.review_note ?? ""} />
      </div>
    </div>
  );
}
