"use client";

import { MotionConfig } from "motion/react";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { applyAppearance, loadAppearance } from "@/lib/appearance";

/** Watches <html data-motion> so Motion animations follow the setting, not only the OS. */
function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
  return () => observer.disconnect();
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const reduced = useSyncExternalStore(
    subscribe,
    () => document.documentElement.dataset.motion === "reduced",
    () => false,
  );
  // "Match device": follow the system if it switches between light and dark.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      const a = loadAppearance();
      if (a.theme === "system") applyAppearance(a);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return <MotionConfig reducedMotion={reduced ? "always" : "user"}>{children}</MotionConfig>;
}
