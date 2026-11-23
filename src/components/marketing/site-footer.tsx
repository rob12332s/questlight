import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { brand } from "@/config/brand";

const YEAR = new Date().getFullYear();

const groups = [
  {
    heading: "Product",
    links: [
      { href: "/features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/signup", label: "Create an account" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-[1fr_auto_auto] sm:gap-16">
        <div className="max-w-xs">
          <div className="flex items-center gap-2 text-ink">
            <LogoMark className="h-6 w-6" />
            <span className="font-semibold tracking-[-0.03em] lowercase">{brand.name}</span>
          </div>
          <p className="mt-3 text-sm text-ink-muted">
            An early-stage product, built in the UK. No adverts, and no real names needed.
          </p>
        </div>
        {groups.map((group) => (
          <nav key={group.heading} aria-label={group.heading}>
            <h2 className="text-sm font-medium text-ink">{group.heading}</h2>
            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-ink-soft hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="container-page border-t border-line py-6 text-xs text-ink-muted">
        © {YEAR} {brand.name}
      </div>
    </footer>
  );
}
