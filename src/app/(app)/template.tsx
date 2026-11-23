/**
 * Templates re-mount on every navigation, so each page eases in. Pure CSS — it starts
 * with the first paint instead of waiting for JavaScript.
 */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-enter-soft">{children}</div>;
}
