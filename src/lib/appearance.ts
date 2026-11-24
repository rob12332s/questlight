/**
 * Appearance preferences: theme, accent colour, text size, font, spacing and motion.
 *
 * They're stored in this browser (localStorage) and applied as data attributes on
 * <html> by a tiny script that runs before the page paints, so there's no flash and
 * static pages stay static. globals.css maps each attribute to design tokens.
 */

export const APPEARANCE_KEY = "ql-appearance";

export const APPEARANCE_OPTIONS = {
  theme: [
    { value: "dark", label: "Dark" },
    { value: "light", label: "Light" },
    { value: "system", label: "Match device" },
  ],
  accent: [
    { value: "indigo", label: "Indigo" },
    { value: "teal", label: "Teal" },
    { value: "rose", label: "Rose" },
    { value: "amber", label: "Amber" },
    { value: "green", label: "Green" },
  ],
  text: [
    { value: "standard", label: "Standard" },
    { value: "large", label: "Large" },
    { value: "larger", label: "Larger" },
  ],
  font: [
    { value: "standard", label: "Standard" },
    { value: "readable", label: "Easy to read" },
  ],
  spacing: [
    { value: "standard", label: "Standard" },
    { value: "relaxed", label: "Relaxed" },
  ],
  motion: [
    { value: "full", label: "Full" },
    { value: "reduced", label: "Reduced" },
  ],
} as const;

type Options = typeof APPEARANCE_OPTIONS;
export type AppearanceKey = keyof Options;
export type Appearance = { [K in AppearanceKey]: Options[K][number]["value"] };

export const DEFAULT_APPEARANCE: Appearance = {
  theme: "dark",
  accent: "indigo",
  text: "standard",
  font: "standard",
  spacing: "standard",
  motion: "full",
};

/** Keeps only known keys and allowed values; anything else falls back to the default. */
export function sanitizeAppearance(raw: unknown): Appearance {
  const input = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out = { ...DEFAULT_APPEARANCE } as Record<AppearanceKey, string>;
  for (const key of Object.keys(APPEARANCE_OPTIONS) as AppearanceKey[]) {
    const value = input[key];
    if (typeof value === "string" && APPEARANCE_OPTIONS[key].some((o) => o.value === value)) out[key] = value;
  }
  return out as Appearance;
}

/** The value written to <html data-theme>: "system" resolves to light or dark. */
export function resolveTheme(theme: Appearance["theme"], prefersLight: boolean): "dark" | "light" {
  if (theme === "system") return prefersLight ? "light" : "dark";
  return theme;
}

/** Applies preferences to <html>. Browser only. */
export function applyAppearance(a: Appearance) {
  const root = document.documentElement;
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  root.dataset.theme = resolveTheme(a.theme, prefersLight);
  root.dataset.accent = a.accent;
  root.dataset.text = a.text;
  root.dataset.font = a.font;
  root.dataset.spacing = a.spacing;
  root.dataset.motion = a.motion;
}

export function loadAppearance(): Appearance {
  try {
    return sanitizeAppearance(JSON.parse(window.localStorage.getItem(APPEARANCE_KEY) ?? "{}"));
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function saveAppearance(a: Appearance) {
  try {
    window.localStorage.setItem(APPEARANCE_KEY, JSON.stringify(a));
  } catch {
    // Storage can be unavailable (private modes, blocked); the choice still applies now.
  }
}

/**
 * Inline script for <head>. Runs before first paint. Kept dependency-free and defensive:
 * anything unexpected leaves the defaults in place.
 */
export const APPEARANCE_SCRIPT = `(function(){try{var o=${JSON.stringify(
  Object.fromEntries(Object.entries(APPEARANCE_OPTIONS).map(([k, v]) => [k, v.map((x) => x.value)])),
)},d=${JSON.stringify(DEFAULT_APPEARANCE)},s={};try{s=JSON.parse(localStorage.getItem("${APPEARANCE_KEY}")||"{}")||{}}catch(e){}var r=document.documentElement;for(var k in o){var v=s[k];if(o[k].indexOf(v)<0)v=d[k];if(k==="theme"&&v==="system")v=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";r.setAttribute("data-"+k,v)}}catch(e){}})();`;
