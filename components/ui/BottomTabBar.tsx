"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/calendar", label: "캘린더", icon: "📅" },
  { href: "/friends", label: "친구", icon: "👭" },
  { href: "/todos", label: "투두", icon: "✅" },
  { href: "/profile", label: "내정보", icon: "🐰" },
];

export function BottomTabBar() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 mx-auto max-w-[480px] flex rounded-t-3xl border-t border-line bg-white/85 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      style={{ boxShadow: "0 -6px 20px rgba(58,138,208,0.08)" }}
    >
      {TABS.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex-1 flex flex-col items-center gap-0.5 pt-2.5 pb-2 text-[11px] transition-colors ${
              active ? "text-brand-dark font-semibold" : "text-ink/45"
            }`}
          >
            <span
              className={`flex h-8 w-12 items-center justify-center rounded-full text-lg transition-colors ${
                active ? "bg-brand-soft" : "bg-transparent"
              }`}
            >
              {t.icon}
            </span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
