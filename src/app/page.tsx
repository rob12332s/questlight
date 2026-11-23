import { brand } from "@/config/brand";

/**
 * Temporary holding page so the app builds and deploys during Stage 1.
 * Replaced by the real landing page once the UI can be compiled and visually reviewed.
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-(--content-max) flex-col items-start justify-center gap-4 px-6">
      <p className="font-mono text-sm tracking-widest text-lumen-400 uppercase">In development</p>
      <h1 className="text-5xl font-bold text-ink">{brand.name}</h1>
      <p className="max-w-xl text-lg text-ink-soft">{brand.description}</p>
    </main>
  );
}
