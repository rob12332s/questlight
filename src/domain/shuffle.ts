/**
 * Deterministic shuffling. The same seed always gives the same order, so a quiz
 * keeps its option order when the page is reloaded, but different quizzes (and
 * different questions) get different orders. Not for anything secret: the
 * answer key never reaches the browser, this only stops the correct option
 * sitting in the same place every time.
 */

/** 32-bit FNV-1a hash of a string. */
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mulberry32: a small, fast seeded generator returning numbers in [0, 1). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Returns a new array in a stable, seed-dependent order (Fisher–Yates). */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const out = items.slice();
  const random = mulberry32(hashSeed(seed));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
