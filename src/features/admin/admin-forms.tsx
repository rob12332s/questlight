"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { saveLesson, updateTopic, type AdminState } from "./actions";

const select = "h-9 rounded-md border border-line-strong bg-night px-2 text-sm";

export function TopicAdminForm({
  topicId,
  verification,
  access,
  contentStatus,
  published,
}: {
  topicId: string;
  verification: string;
  access: string;
  contentStatus: string;
  published: boolean;
}) {
  const [state, action, pending] = useActionState<AdminState, FormData>(updateTopic, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="topicId" value={topicId} />
      <select name="verification" defaultValue={verification} className={select} aria-label="Verification">
        <option value="awaiting_verification">Awaiting verification</option>
        <option value="verified">Verified</option>
      </select>
      <select name="access" defaultValue={access} className={select} aria-label="Access">
        <option value="free">Free</option>
        <option value="pro">Pro</option>
      </select>
      <select name="contentStatus" defaultValue={contentStatus} className={select} aria-label="Content status">
        <option value="lesson">Full lesson</option>
        <option value="practice">Quiz practice</option>
        <option value="planned">Being written</option>
      </select>
      <label className="flex items-center gap-1.5 text-sm">
        <input type="checkbox" name="published" defaultChecked={published} /> Listed
      </label>
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        Save
      </Button>
      {state.message && <span className="text-xs text-correct">{state.message}</span>}
      {state.error && <span className="text-xs text-incorrect">{state.error}</span>}
    </form>
  );
}

export function LessonEditor({ topicId, content, status, note }: { topicId: string; content: string; status: string; note: string }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(saveLesson, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="topicId" value={topicId} />
      <label className="block text-sm font-medium">
        Lesson JSON
        <textarea
          name="content"
          defaultValue={content}
          rows={28}
          spellCheck={false}
          className="mt-1.5 w-full rounded-lg border border-line-strong bg-night p-3 font-mono text-xs leading-relaxed"
        />
      </label>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Status
          <select name="status" defaultValue={status} className={select}>
            <option value="draft">Draft</option>
            <option value="in_review">In review</option>
            <option value="published">Published</option>
          </select>
        </label>
        <label className="flex min-w-64 flex-1 flex-col gap-1 text-sm">
          Review note
          <input name="note" defaultValue={note} maxLength={1000} className="h-9 rounded-md border border-line-strong bg-night px-2" />
        </label>
        <Button type="submit" disabled={pending}>
          Save lesson
        </Button>
      </div>
      <div role="status">
        {state.message && <p className="text-sm text-correct">{state.message}</p>}
        {state.error && <p className="text-sm text-incorrect">{state.error}</p>}
        {state.problems && (
          <ul className="mt-2 list-disc pl-5 text-sm text-incorrect">
            {state.problems.slice(0, 30).map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
      </div>
    </form>
  );
}
