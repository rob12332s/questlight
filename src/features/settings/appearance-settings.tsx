"use client";

import { Check, RotateCcw } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Segmented } from "@/components/ui/segmented";
import {
  APPEARANCE_KEY,
  APPEARANCE_OPTIONS,
  DEFAULT_APPEARANCE,
  applyAppearance,
  sanitizeAppearance,
  saveAppearance,
  type Appearance,
} from "@/lib/appearance";
import { cn } from "@/lib/cn";

const CHANGE_EVENT = "ql-appearance-change";
let cachedRaw: string | null = null;
let cached: Appearance = DEFAULT_APPEARANCE;

function getSnapshot(): Appearance {
  let raw = "";
  try {
    raw = window.localStorage.getItem(APPEARANCE_KEY) ?? "";
  } catch {
    raw = "";
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cached = sanitizeAppearance(raw ? JSON.parse(raw) : {});
    } catch {
      cached = DEFAULT_APPEARANCE;
    }
  }
  return cached;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function update(next: Appearance) {
  saveAppearance(next);
  applyAppearance(next);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// Swatches show each accent as it looks on the dark theme.
const SWATCHES: Record<Appearance["accent"], string> = {
  indigo: "#7b86ff",
  teal: "#2ec4b6",
  rose: "#f472a6",
  amber: "#f5b041",
  green: "#6fcf80",
};

export function AppearanceSettings() {
  const a = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_APPEARANCE);
  const set = <K extends keyof Appearance>(key: K, value: Appearance[K]) => update({ ...a, [key]: value });
  const isDefault = (Object.keys(DEFAULT_APPEARANCE) as Array<keyof Appearance>).every((k) => a[k] === DEFAULT_APPEARANCE[k]);

  return (
    <div className="space-y-7">
      <Segmented name="theme" legend="Theme" choices={APPEARANCE_OPTIONS.theme} value={a.theme} onChange={(v) => set("theme", v)} />

      <fieldset>
        <legend className="text-sm font-medium text-ink">Accent colour</legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {APPEARANCE_OPTIONS.accent.map((o) => (
            <label key={o.value} className="group flex cursor-pointer flex-col items-center gap-1.5">
              <input
                type="radio"
                name="accent"
                value={o.value}
                checked={a.accent === o.value}
                onChange={() => set("accent", o.value)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105",
                  "peer-focus-visible:ring-2 peer-focus-visible:ring-ink peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-night",
                  a.accent === o.value && "ring-2 ring-ink ring-offset-2 ring-offset-night",
                )}
                style={{ backgroundColor: SWATCHES[o.value] }}
                aria-hidden
              >
                {a.accent === o.value && <Check className="h-4 w-4 text-night" strokeWidth={3} />}
              </span>
              <span className={cn("text-xs", a.accent === o.value ? "text-ink" : "text-ink-muted")}>{o.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Segmented name="text" legend="Text size" choices={APPEARANCE_OPTIONS.text} value={a.text} onChange={(v) => set("text", v)} />
      <div className="grid gap-7 sm:grid-cols-2">
        <Segmented name="font" legend="Font" choices={APPEARANCE_OPTIONS.font} value={a.font} onChange={(v) => set("font", v)} />
        <Segmented name="spacing" legend="Line spacing" choices={APPEARANCE_OPTIONS.spacing} value={a.spacing} onChange={(v) => set("spacing", v)} />
      </div>
      <Segmented name="motion" legend="Animation" choices={APPEARANCE_OPTIONS.motion} value={a.motion} onChange={(v) => set("motion", v)} />

      <div aria-label="Preview" role="group" className="rounded-xl border border-line bg-deep p-4">
        <p className="text-xs text-ink-muted">Preview</p>
        <div className="mt-3 rounded-lg bg-paper p-4 text-paper-ink shadow-paper">
          <p className="font-semibold">Which organelle releases energy through aerobic respiration?</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <span className="flex items-center gap-2 rounded-md border border-correct bg-correct-wash px-3 py-2 text-sm">
              <Check className="h-4 w-4 text-correct" aria-hidden strokeWidth={2.5} /> Mitochondria
            </span>
            <span className="rounded-md border border-paper-line bg-white px-3 py-2 text-sm">Ribosome</span>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span className="inline-flex h-9 items-center rounded-md bg-beam px-3 text-sm font-medium text-night">Start quiz</span>
          <span className="text-sm text-beam-bright">Level 3, 240 XP</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-ink-muted" aria-live="polite">
          Changes apply straight away and are saved on this device.
        </p>
        <button
          type="button"
          onClick={() => update(DEFAULT_APPEARANCE)}
          disabled={isDefault}
          className="inline-flex shrink-0 items-center gap-1.5 text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline disabled:opacity-40 disabled:hover:no-underline"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset to default
        </button>
      </div>
    </div>
  );
}
