"use client";

import { cn } from "@/lib/cn";

/** A row of radio buttons styled as one control. Wraps to two rows on phones when there are four or more. */
export function Segmented<T extends string | number>({
  name,
  legend,
  choices,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  choices: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-ink">{legend}</legend>
      <div
        className={cn(
          "mt-2 grid gap-1 rounded-lg bg-deep p-1 shadow-[inset_0_0_0_1px_var(--color-line)]",
          // Four longer labels don't fit in one row on a phone.
          choices.length > 3 ? "grid-cols-2 sm:grid-cols-4" : "auto-cols-fr grid-flow-col",
        )}
      >
        {choices.map((choice) => (
          <label
            key={String(choice.value)}
            className={cn(
              "relative flex h-10 cursor-pointer items-center justify-center rounded-md px-2 text-sm font-medium transition-colors duration-200",
              value === choice.value ? "bg-slate-raised text-ink shadow-raised" : "text-ink-soft hover:text-ink",
            )}
          >
            <input
              type="radio"
              name={name}
              value={String(choice.value)}
              checked={value === choice.value}
              onChange={() => onChange(choice.value)}
              className="sr-only"
            />
            {choice.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
