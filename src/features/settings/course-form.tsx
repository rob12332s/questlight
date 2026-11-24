"use client";

import { useActionState, useState } from "react";
import { SubjectIcon } from "@/components/subject-icon";
import { Field, FormAlert, Select, SubmitButton } from "@/components/ui/form";
import { BOARD_NAMES, BOARDS, type Board } from "@/config/boards";
import type { CourseOption } from "@/content/library/types";
import { initialFormState } from "@/features/auth/schemas";
import { updateCourse } from "./actions";

const TIERED = new Set(["maths", "biology", "chemistry", "physics", "combined-science"]);
const CONFIDENCE = ["Not confident", "A bit unsure", "Okay", "Fairly confident", "Very confident"];

export interface CourseFormProps {
  subject: { id: string; slug: string; name: string };
  board: Board | null;
  tier: "foundation" | "higher" | null;
  options: string[];
  confidence: number | null;
  available: CourseOption[];
}

/** One subject's course: board, tier, set texts / units, and confidence. */
export function CourseForm({ subject, board, tier, options, confidence, available }: CourseFormProps) {
  const [state, action] = useActionState(updateCourse, initialFormState);
  const [chosenBoard, setChosenBoard] = useState<string>(board ?? "");
  // Show options for the chosen board (options with no board apply to every board).
  const visible = available.filter((o) => !chosenBoard || o.boards.length === 0 || o.boards.includes(chosenBoard as Board));
  const groups = [...new Set(visible.map((o) => o.group))];

  return (
    <form action={action} className="rounded-2xl border border-line bg-deep p-5">
      <input type="hidden" name="subjectId" value={subject.id} />
      <h3 className="flex items-center gap-2.5 font-semibold">
        <SubjectIcon slug={subject.slug} className="h-5 w-5 text-ink-soft" />
        {subject.name}
      </h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Exam board">
          {(p) => (
            <Select {...p} name="board" value={chosenBoard} onChange={(e) => setChosenBoard(e.target.value)}>
              <option value="">Not sure yet</option>
              {BOARDS.map((b) => (
                <option key={b} value={b}>
                  {BOARD_NAMES[b]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {TIERED.has(subject.slug) && (
          <Field label="Tier">
            {(p) => (
              <Select {...p} name="tier" defaultValue={tier ?? ""}>
                <option value="">Not sure yet</option>
                <option value="foundation">Foundation</option>
                <option value="higher">Higher</option>
              </Select>
            )}
          </Field>
        )}
        <Field label="How confident do you feel?">
          {(p) => (
            <Select {...p} name="confidence" defaultValue={confidence ? String(confidence) : ""}>
              <option value="">Prefer not to say</option>
              {CONFIDENCE.map((c, i) => (
                <option key={c} value={i + 1}>
                  {c}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      {groups.length > 0 && (
        <fieldset className="mt-5">
          <legend className="text-sm font-medium">
            {subject.slug === "history" ? "Units you study" : subject.slug === "english-literature" ? "Set texts you study" : "Options you study"}
          </legend>
          <p className="mt-1 text-sm text-ink-muted">Leave all unticked to see everything.</p>
          {groups.map((g) => (
            <div key={g} className="mt-3">
              <p className="text-xs font-medium text-ink-soft">{g}</p>
              <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                {visible
                  .filter((o) => o.group === g)
                  .map((o) => (
                    <label key={o.key} className="flex items-start gap-2.5 rounded-md p-1.5 text-sm hover:bg-slate/50">
                      <input type="checkbox" name="options" value={o.key} defaultChecked={options.includes(o.key)} className="mt-0.5 h-4 w-4 accent-[var(--color-beam)]" />
                      <span>{o.name}</span>
                    </label>
                  ))}
              </div>
            </div>
          ))}
        </fieldset>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <SubmitButton pendingLabel="Saving…" size="sm">
          Save {subject.name}
        </SubmitButton>
        {state.message && state.status !== "idle" && <FormAlert tone={state.status === "success" ? "success" : "error"}>{state.message}</FormAlert>}
      </div>
    </form>
  );
}
