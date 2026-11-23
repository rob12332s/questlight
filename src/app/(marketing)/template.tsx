/** Each public page eases in on navigation. The header stays put (it lives in the layout). */
export default function MarketingTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-enter-soft">{children}</div>;
}
