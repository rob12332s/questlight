"use client";

import { AnimatePresence, motion } from "motion/react";
import { LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { logOut } from "@/features/auth/actions";
import { cn } from "@/lib/cn";
import { PRIMARY_NAV, SECONDARY_NAV, navStatus, type NavItem } from "./nav";

function NavLink({
  item,
  onNavigate,
  aiEnabled,
  isPro,
}: {
  item: NavItem;
  onNavigate?: () => void;
  aiEnabled?: boolean;
  isPro?: boolean;
}) {
  const pathname = usePathname();
  const status = navStatus(item);
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  if (status !== "available") {
    return (
      <span
        aria-disabled="true"
        title={status === "in_development" ? "Being built now" : "Planned for later"}
        className="flex h-10 cursor-not-allowed items-center gap-3 rounded-md px-3 text-[0.9375rem] text-ink-muted"
      >
        <Icon className="h-[18px] w-[18px] shrink-0 opacity-70" aria-hidden strokeWidth={1.75} />
        <span className="flex-1">{item.label}</span>
        <span className="text-xs">{status === "in_development" ? "Soon" : "Later"}</span>
        <span className="sr-only">(not available yet)</span>
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-10 items-center gap-3 rounded-md px-3 text-[0.9375rem] transition-colors",
        active ? "bg-beam-wash text-ink" : "text-ink-soft hover:bg-slate/60 hover:text-ink",
      )}
    >
      {active && (
        <motion.span
          layoutId="app-nav-indicator"
          className="absolute inset-y-2 -left-3 w-[3px] rounded-full bg-beam"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      )}
      <Icon
        className={cn("h-[18px] w-[18px] shrink-0", active && "text-beam-bright", item.tag === "pro" && "text-pro")}
        aria-hidden
        strokeWidth={1.75}
      />
      <span className="flex-1">{item.label}</span>
      {item.tag === "pro" && isPro && <span className="text-xs text-pro">Active</span>}
      {item.featureId === "ai-study" && !aiEnabled && (
        <span className="text-xs text-ink-muted">
          Off<span className="sr-only"> (not switched on for this site)</span>
        </span>
      )}
    </Link>
  );
}

function NavLists({ onNavigate, aiEnabled, isPro }: { onNavigate?: () => void; aiEnabled: boolean; isPro: boolean }) {
  return (
    <>
      <ul className="space-y-0.5">
        {PRIMARY_NAV.map((item) => (
          <li key={item.href}>
            <NavLink item={item} onNavigate={onNavigate} aiEnabled={aiEnabled} />
          </li>
        ))}
      </ul>
      <div className="mt-auto space-y-0.5 border-t border-line pt-4">
        {SECONDARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} onNavigate={onNavigate} isPro={isPro} />
        ))}
        <form action={logOut}>
          <button
            type="submit"
            className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-[0.9375rem] text-ink-soft transition-colors hover:bg-slate/60 hover:text-ink"
          >
            <LogOut className="h-[18px] w-[18px]" aria-hidden strokeWidth={1.75} />
            Log out
          </button>
        </form>
      </div>
    </>
  );
}

/** Desktop sidebar. */
export function Sidebar({ displayName, aiEnabled, isPro }: { displayName: string; aiEnabled: boolean; isPro: boolean }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-deep px-4 py-5 lg:flex">
      <Link href="/dashboard" aria-label="Questlight dashboard" className="mb-8 rounded-sm px-2">
        <Logo />
      </Link>
      <nav aria-label="App" className="flex flex-1 flex-col">
        <NavLists aiEnabled={aiEnabled} isPro={isPro} />
      </nav>
      <p className="mt-4 truncate px-3 text-xs text-ink-muted">Signed in as {displayName}</p>
    </aside>
  );
}

/** Mobile top bar with a slide-down menu. */
export function MobileNav({ aiEnabled, isPro }: { aiEnabled: boolean; isPro: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="sticky top-0 z-40 border-b border-line bg-night/90 backdrop-blur-md lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/dashboard" aria-label="Questlight dashboard" className="rounded-sm">
          <Logo />
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="app-mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-soft hover:bg-slate hover:text-ink"
        >
          {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.nav
            id="app-mobile-menu"
            aria-label="App"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col overflow-hidden px-4"
          >
            <div className="flex flex-col py-3">
              <NavLists onNavigate={() => setOpen(false)} aiEnabled={aiEnabled} isPro={isPro} />
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
