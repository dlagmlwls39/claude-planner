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
    <nav className="fixed bottom-0 inset-x-0 mx-auto max-w-[480px] border-t bg-white/90 backdrop-blur flex">
      {TABS.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex-1 flex flex-col items-center py-2 text-xs ${
              active ? "text-pastel-pinkdark font-semibold" : "text-pastel-ink/50"
            }`}
          >
            <span className="text-xl">{t.icon}</span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
