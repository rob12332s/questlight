"use client";

import { useSyncExternalStore } from "react";

/**
 * The current time, updated a few times a second while any component is listening.
 * Returns 0 during server rendering and hydration, so callers can show a neutral state
 * until the real clock is known (and server and client HTML always match).
 */
let latest = 0;
const listeners = new Set<() => void>();
let timer: number | undefined;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (timer === undefined) {
    latest = Date.now();
    timer = window.setInterval(() => {
      latest = Date.now();
      for (const l of listeners) l();
    }, 200);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
    }
  };
}

export function useNow(): number {
  return useSyncExternalStore(
    subscribe,
    () => latest,
    () => 0,
  );
}
